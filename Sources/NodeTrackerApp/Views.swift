import SwiftUI
import NodeTrackerCore

struct PopoverRootView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject private var settings: SettingsStore

    init(store: NodeTrackerStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    var body: some View {
        let visibleOtherProcesses = self.store.visibleOtherProcesses()
        let busyWatchedPorts = self.store.snapshot.watchedPorts
            .filter(\.isBusy)
            .sorted(by: DisplayText.compareWatchedPorts)

        ScrollView {
            CompactPanel {
                CompactHeader(
                    snapshot: self.store.snapshot,
                    isRefreshing: self.store.isRefreshing,
                    useSampleData: self.store.useSampleData,
                    visibleOtherCount: visibleOtherProcesses.count,
                    showsAllOtherListeners: self.settings.showNonNodeListeners
                )

                CompactDivider()

                BusyWatchedPortsSection(
                    statuses: busyWatchedPorts,
                    totalCount: self.store.snapshot.watchedPorts.count
                )

                if self.settings.groupMode == .project, !self.store.snapshot.projects.isEmpty {
                    CompactDivider()
                    ProjectGroupsView(store: self.store)
                } else if self.settings.groupMode == .port, !self.store.snapshot.allProcesses.isEmpty {
                    CompactDivider()
                    PortGroupsView(store: self.store)
                }

                if !visibleOtherProcesses.isEmpty {
                    CompactDivider()
                    OtherListenersSection(store: self.store, processes: visibleOtherProcesses)
                }
            }
            .padding(12)
        }
        .background(Color.clear)
        .overlay(alignment: .bottomTrailing) {
            if let notice = self.store.clipboardNotice {
                Text(notice)
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.thinMaterial, in: Capsule())
                    .padding()
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            self.store.clipboardNotice = nil
                        }
                    }
            }
        }
    }
}

private struct CompactHeader: View {
    let snapshot: AppSnapshot
    let isRefreshing: Bool
    let useSampleData: Bool
    let visibleOtherCount: Int
    let showsAllOtherListeners: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("NodeWatcher")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Text(self.useSampleData ? "Sample data mode" : self.relativeUpdatedText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if self.isRefreshing {
                    ProgressView()
                        .controlSize(.small)
                }
            }

            HStack(spacing: 18) {
                HeaderMetric(value: self.snapshot.summary.nodeProjectCount, title: "Projects")
                HeaderMetric(value: self.snapshot.summary.watchedBusyCount, title: "Busy watched")
                HeaderMetric(
                    value: self.visibleOtherCount,
                    title: self.showsAllOtherListeners ? "Other listeners" : "Conflicts"
                )
            }
        }
    }

    private var relativeUpdatedText: String {
        let elapsed = Date().timeIntervalSince(self.snapshot.generatedAt)
        guard elapsed > 3 else { return "Updated just now" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return "Updated \(formatter.localizedString(fromTimeInterval: -elapsed))"
    }
}

private struct HeaderMetric: View {
    let value: Int
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(verbatim: String(self.value))
                .font(.title3)
                .fontWeight(.semibold)
            Text(self.title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct BusyWatchedPortsSection: View {
    let statuses: [WatchedPortStatus]
    let totalCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            CompactSectionHeader(
                title: "Watched ports",
                trailing: self.statuses.isEmpty ? "All free" : "\(self.statuses.count) busy"
            )

            if self.statuses.isEmpty {
                Text("All \(self.totalCount) watched ports are free.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("\(max(self.totalCount - self.statuses.count, 0)) free of \(self.totalCount) watched ports.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                CompactSurface {
                    let statuses = self.statuses
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(statuses.enumerated()), id: \.element.id) { index, status in
                            if index > 0 {
                                CompactRowDivider()
                            }
                            BusyPortRow(status: status)
                                .padding(.vertical, 8)
                        }
                    }
                }
            }
        }
    }
}

private struct BusyPortRow: View {
    let status: WatchedPortStatus

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            PortBadge(port: self.status.port, tone: self.tone)

            VStack(alignment: .leading, spacing: 2) {
                Text(DisplayText.watchedPortSummary(self.status))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                Text(DisplayText.watchedPortDetail(self.status))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            StatusTag(text: self.tagText, tone: self.tone)
        }
    }

    private var tone: AccentTone {
        if self.status.isConflict {
            return .warning
        }
        if self.status.isNodeOwned {
            return .node
        }
        return .neutral
    }

    private var tagText: String {
        if self.status.isConflict {
            return "Conflict"
        }
        if self.status.isNodeOwned {
            return "Node"
        }
        return "Busy"
    }
}

private struct ProjectGroupsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        let projects = self.sortedProjects()

        VStack(alignment: .leading, spacing: 10) {
            CompactSectionHeader(title: "Projects", trailing: "\(projects.count)")
            ForEach(projects) { project in
                ProjectGroup(store: self.store, project: project)
            }
        }
    }

    private func sortedProjects() -> [ProjectSnapshot] {
        let watchedPorts = Set(self.store.settings.watchedPorts)
        return self.store.snapshot.projects.sorted { lhs, rhs in
            let lhsWatched = lhs.ports.filter(watchedPorts.contains).count
            let rhsWatched = rhs.ports.filter(watchedPorts.contains).count
            if lhsWatched != rhsWatched {
                return lhsWatched > rhsWatched
            }

            let nameComparison = lhs.displayName.localizedCaseInsensitiveCompare(rhs.displayName)
            if nameComparison != .orderedSame {
                return nameComparison == .orderedAscending
            }

            if lhs.isWorktreeLike != rhs.isWorktreeLike {
                return lhs.isWorktreeLike == false
            }

            if lhs.projectRoot != rhs.projectRoot {
                return lhs.projectRoot < rhs.projectRoot
            }

            return lhs.ports.lexicographicallyPrecedes(rhs.ports)
        }
    }
}

private struct ProjectGroup: View {
    @ObservedObject var store: NodeTrackerStore
    let project: ProjectSnapshot

    var body: some View {
        CompactSurface {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(self.project.displayName)
                        .font(.headline)
                    if self.project.isWorktreeLike {
                        StatusTag(text: "worktree", tone: .warning)
                    }
                    Spacer()
                    PortBadgeRow(ports: self.project.ports)
                }

                Text(DisplayText.path(self.project.projectRoot))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)

                let processes = self.sortedProcesses()
                if !processes.isEmpty {
                    CompactRowDivider()
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(processes.enumerated()), id: \.element.id) { index, process in
                            if index > 0 {
                                CompactRowDivider()
                            }
                            ProcessCompactRow(store: self.store, process: process)
                                .padding(.vertical, 8)
                        }
                    }
                }
            }
        }
    }

    private func sortedProcesses() -> [TrackedProcessSnapshot] {
        self.project.processes.sorted { lhs, rhs in
            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let labelComparison = lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel)
            if labelComparison != .orderedSame {
                return labelComparison == .orderedAscending
            }

            return lhs.process.pid < rhs.process.pid
        }
    }
}

private struct PortGroupsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        let groups = self.groupedPorts()

        VStack(alignment: .leading, spacing: 10) {
            CompactSectionHeader(title: "Ports", trailing: "\(groups.count)")
            ForEach(groups, id: \.port) { group in
                CompactSurface {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Port \(String(group.port))")
                                .font(.headline)
                            Spacer()
                            StatusTag(text: "\(group.processes.count)", tone: .neutral)
                        }

                        CompactRowDivider()

                        let processes = self.sortedProcesses(group.processes)
                        VStack(alignment: .leading, spacing: 0) {
                            ForEach(Array(processes.enumerated()), id: \.element.id) { index, process in
                                if index > 0 {
                                    CompactRowDivider()
                                }
                                ProcessCompactRow(store: self.store, process: process)
                                    .padding(.vertical, 8)
                            }
                        }
                    }
                }
            }
        }
    }

    private func groupedPorts() -> [(port: Int, processes: [TrackedProcessSnapshot])] {
        let grouped = Dictionary(grouping: self.store.snapshot.allProcesses.flatMap { process in
            process.ports.map { ($0, process) }
        }, by: \.0)

        return grouped.keys.sorted().map { port in
            (port, grouped[port]?.map(\.1) ?? [])
        }
    }

    private func sortedProcesses(_ processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        processes.sorted { lhs, rhs in
            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let labelComparison = lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel)
            if labelComparison != .orderedSame {
                return labelComparison == .orderedAscending
            }

            return lhs.process.pid < rhs.process.pid
        }
    }
}

private struct ProcessCompactRow: View {
    @ObservedObject var store: NodeTrackerStore
    let process: TrackedProcessSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(self.process.process.toolLabel)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text(self.pidAndUptime)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(DisplayText.command(self.process.process))
                .font(.caption)
                .foregroundStyle(.secondary)
                .textSelection(.enabled)
                .lineLimit(1)
                .truncationMode(.middle)

            HStack(spacing: 8) {
                PortBadgeRow(ports: self.process.ports)
                if let firstListener = self.process.listeners.first {
                    Text(firstListener.hostScope.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
            }

            HStack(spacing: 12) {
                if self.canReveal {
                    InlineTextButton("Reveal") {
                        self.store.reveal(path: self.process.process.cwd)
                    }
                }
                if self.canOpenTerminal {
                    InlineTextButton("Terminal") {
                        self.store.openTerminal(path: self.process.process.cwd)
                    }
                }
                ProcessActionsMenu(
                    store: self.store,
                    process: self.process,
                    canTerminate: self.canTerminate
                )
                Spacer(minLength: 0)
            }
        }
    }

    private var pidAndUptime: String {
        "PID \(self.process.process.pid) \u{00B7} \(self.process.process.uptime)"
    }

    private var canReveal: Bool {
        self.hasMeaningfulDirectory
    }

    private var canOpenTerminal: Bool {
        self.process.process.isNodeFamily && self.hasMeaningfulDirectory
    }

    private var canTerminate: Bool {
        if self.process.process.isNodeFamily {
            return true
        }
        guard self.hasMeaningfulDirectory else { return false }
        let command = self.process.process.commandLine
        if command.hasPrefix("/System/") || command.hasPrefix("/usr/") || command.hasPrefix("/Applications/") {
            return false
        }
        return true
    }

    private var hasMeaningfulDirectory: Bool {
        guard let cwd = self.process.process.cwd, cwd != "/" else { return false }
        return FileManager.default.fileExists(atPath: cwd)
    }
}

private struct ProcessActionsMenu: View {
    @ObservedObject var store: NodeTrackerStore
    let process: TrackedProcessSnapshot
    let canTerminate: Bool

    var body: some View {
        Menu {
            Button("Copy PID") {
                self.store.copyText(String(self.process.process.pid), label: "PID")
            }
            Button("Copy command") {
                self.store.copyText(self.process.process.commandLine, label: "Command")
            }
            if self.canTerminate {
                Divider()
                Button("Terminate", role: .destructive) {
                    self.store.terminate(process: self.process)
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text("More")
                Image(systemName: "ellipsis")
                    .font(.caption2)
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .menuStyle(BorderlessButtonMenuStyle())
    }
}

private struct OtherListenersSection: View {
    @ObservedObject var store: NodeTrackerStore
    let processes: [TrackedProcessSnapshot]

    var body: some View {
        let processes = self.sortedProcesses()

        VStack(alignment: .leading, spacing: 10) {
            CompactSectionHeader(
                title: self.store.settings.showNonNodeListeners ? "Other listeners" : "Conflicts",
                trailing: "\(processes.count)"
            )

            if !self.store.settings.showNonNodeListeners {
                Text("Showing watched-port conflicts only.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            CompactSurface {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(processes.enumerated()), id: \.element.id) { index, process in
                        if index > 0 {
                            CompactRowDivider()
                        }
                        ProcessCompactRow(store: self.store, process: process)
                            .padding(.vertical, 8)
                    }
                }
            }
        }
    }

    private func sortedProcesses() -> [TrackedProcessSnapshot] {
        self.processes.sorted { lhs, rhs in
            if lhs.isWatchedConflict != rhs.isWatchedConflict {
                return lhs.isWatchedConflict && !rhs.isWatchedConflict
            }

            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let labelComparison = lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel)
            if labelComparison != .orderedSame {
                return labelComparison == .orderedAscending
            }

            return lhs.process.pid < rhs.process.pid
        }
    }
}

private struct CompactPanel<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            self.content
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct CompactSurface<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        self.content
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.primary.opacity(0.045), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct CompactSectionHeader: View {
    let title: String
    let trailing: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(self.title)
                .font(.headline)
            Spacer()
            if let trailing {
                Text(trailing)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct CompactDivider: View {
    var body: some View {
        Divider()
            .padding(.vertical, 12)
    }
}

private struct CompactRowDivider: View {
    var body: some View {
        Divider()
            .overlay(Color.primary.opacity(0.06))
    }
}

private enum AccentTone {
    case neutral
    case node
    case warning

    var fill: Color {
        switch self {
        case .neutral:
            return Color.primary.opacity(0.08)
        case .node:
            return Color.blue.opacity(0.14)
        case .warning:
            return Color.orange.opacity(0.16)
        }
    }

    var foreground: Color {
        switch self {
        case .neutral:
            return .primary
        case .node:
            return .blue
        case .warning:
            return .orange
        }
    }
}

private struct PortBadge: View {
    let port: Int
    let tone: AccentTone

    var body: some View {
        Text(verbatim: String(self.port))
            .font(.system(.caption, design: .monospaced))
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(self.tone.fill, in: Capsule())
    }
}

private struct PortBadgeRow: View {
    let ports: [Int]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(self.ports, id: \.self) { port in
                PortBadge(port: port, tone: .neutral)
            }
        }
    }
}

private struct StatusTag: View {
    let text: String
    let tone: AccentTone

    var body: some View {
        Text(self.text)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(self.tone.foreground)
            .padding(.horizontal, 7)
            .padding(.vertical, 4)
            .background(self.tone.fill, in: Capsule())
    }
}

private struct InlineTextButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: self.action) {
            Text(self.title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .buttonStyle(.plain)
    }
}

private enum DisplayText {
    static func compareWatchedPorts(_ lhs: WatchedPortStatus, _ rhs: WatchedPortStatus) -> Bool {
        if lhs.isConflict != rhs.isConflict {
            return lhs.isConflict && !rhs.isConflict
        }
        if lhs.isNodeOwned != rhs.isNodeOwned {
            return lhs.isNodeOwned && !rhs.isNodeOwned
        }
        return lhs.port < rhs.port
    }

    static func path(_ path: String) -> String {
        NSString(string: path).abbreviatingWithTildeInPath
    }

    static func watchedPortSummary(_ status: WatchedPortStatus) -> String {
        guard status.isBusy else { return "Free" }
        let owners = status.ownerSummary
            .split(separator: ",")
            .map { stripPID(from: $0.trimmingCharacters(in: .whitespacesAndNewlines)) }

        guard let firstOwner = owners.first, !firstOwner.isEmpty else {
            return "In use"
        }

        if owners.count == 1 {
            return firstOwner
        }
        return "\(firstOwner) +\(owners.count - 1)"
    }

    static func watchedPortDetail(_ status: WatchedPortStatus) -> String {
        if status.isConflict {
            return "Non-Node listener on a watched port"
        }
        if status.isNodeOwned {
            return "Node process on a watched port"
        }
        return status.ownerSummary
    }

    static func command(_ process: ProcessSnapshot) -> String {
        let normalized = normalizeCommand(process.commandLine, cwd: process.cwd)
        let tokens = normalized
            .split(whereSeparator: \.isWhitespace)
            .map(String.init)
        guard !tokens.isEmpty else { return normalized }

        if tokens.count >= 2, basename(tokens[0]) == "node" {
            let launched = tokens[1]
            if launched.contains("/node_modules/.bin/") {
                let simplified = [basename(launched)] + Array(tokens.dropFirst(2))
                return trimmed(simplified.joined(separator: " "))
            }
        }

        var displayTokens = tokens
        displayTokens[0] = basename(displayTokens[0])
        return trimmed(displayTokens.joined(separator: " "))
    }

    private static func normalizeCommand(_ command: String, cwd: String?) -> String {
        guard let cwd, !cwd.isEmpty, cwd != "/" else { return command }
        let cwdWithSlash = cwd.hasSuffix("/") ? cwd : cwd + "/"
        return command
            .replacingOccurrences(of: cwdWithSlash, with: "")
            .replacingOccurrences(of: cwd, with: ".")
    }

    private static func basename(_ token: String) -> String {
        URL(fileURLWithPath: token).lastPathComponent
    }

    private static func stripPID(from owner: String) -> String {
        owner.replacingOccurrences(of: #"\s*\(\d+\)$"#, with: "", options: .regularExpression)
    }

    private static func trimmed(_ command: String) -> String {
        let tokens = command.split(whereSeparator: \.isWhitespace)
        if tokens.count <= 6 {
            return command
        }
        return tokens.prefix(6).joined(separator: " ") + " …"
    }
}

struct SettingsRootView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject private var settings: SettingsStore

    init(store: NodeTrackerStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    var body: some View {
        TabView {
            GeneralSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("General", systemImage: "gearshape") }
            DisplaySettingsView(settings: self.settings)
                .tabItem { Label("Display", systemImage: "eye") }
            AboutSettingsView(store: self.store)
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .padding(20)
        .frame(width: 560, height: 420)
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Toggle("Start at login", isOn: self.$settings.launchAtLogin)
            Picker("Refresh cadence", selection: self.$settings.refreshCadence) {
                ForEach(RefreshCadence.allCases) { cadence in
                    Text(cadence.label).tag(cadence)
                }
            }
            Toggle("Confirm before terminate", isOn: self.$settings.confirmBeforeTerminate)
            if self.store.useSampleData {
                Text("The app is currently running in sample-data mode.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            if let error = self.store.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
        }
        .formStyle(.grouped)
    }
}

private struct DisplaySettingsView: View {
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Picker("Group content by", selection: self.$settings.groupMode) {
                ForEach(GroupMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            Toggle("Show non-Node listeners", isOn: self.$settings.showNonNodeListeners)
            TextField("Watched ports", text: self.$settings.watchedPortsText, prompt: Text("3000,5173,8081"))
            Text("Comma-separated list of ports to highlight in the menu bar and popover.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
    }
}

private struct AboutSettingsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        Form {
            LabeledContent("Version", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev")
            Button("Copy latest snapshot JSON") {
                self.store.copySnapshotJSON()
            }
            Section("Diagnostics") {
                ForEach(self.store.snapshot.diagnostics.commands, id: \.self) { command in
                    Text(command)
                        .font(.system(.footnote, design: .monospaced))
                        .textSelection(.enabled)
                }
            }
        }
        .formStyle(.grouped)
    }
}
