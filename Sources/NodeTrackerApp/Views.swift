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
        let busyWatchedPortSet = Set(busyWatchedPorts.map(\.port))
        let otherActiveProjects = SnapshotDetails.projectsExcludingPorts(
            self.store.snapshot.projects,
            excludedPorts: busyWatchedPortSet
        )
        let extraOtherListeners = self.settings.showNonNodeListeners
            ? SnapshotDetails.processesExcludingPorts(
                visibleOtherProcesses,
                excludedPorts: busyWatchedPortSet
            )
            : []

        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                CompactHeader(
                    snapshot: self.store.snapshot,
                    isRefreshing: self.store.isRefreshing,
                    useSampleData: self.store.useSampleData,
                    visibleOtherCount: visibleOtherProcesses.count,
                    showsAllOtherListeners: self.settings.showNonNodeListeners
                )

                CompactDivider()

                WatchedPortsSection(
                    store: self.store,
                    statuses: busyWatchedPorts,
                    visibleOtherProcesses: visibleOtherProcesses
                )

                if !otherActiveProjects.isEmpty {
                    CompactDivider()
                    AdditionalNodePortsSection(projects: otherActiveProjects)
                }

                if !extraOtherListeners.isEmpty {
                    CompactDivider()
                    OtherListenersSection(processes: extraOtherListeners)
                }
            }
            .padding(16)
        }
        .background(Color(nsColor: .windowBackgroundColor))
        .overlay(alignment: .bottomTrailing) {
            if let notice = self.store.clipboardNotice {
                Text(notice)
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color(nsColor: .windowBackgroundColor), in: Capsule())
                    .overlay(
                        Capsule().stroke(Color.primary.opacity(0.08), lineWidth: 1)
                    )
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
                HeaderMetric(value: self.snapshot.summary.watchedBusyCount, title: "Watched busy")
                HeaderMetric(
                    value: self.visibleOtherCount,
                    title: self.showsAllOtherListeners ? "Other listeners" : "Blocked"
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

private struct WatchedPortsSection: View {
    @ObservedObject var store: NodeTrackerStore
    let statuses: [WatchedPortStatus]
    let visibleOtherProcesses: [TrackedProcessSnapshot]

    @State private var expandedPort: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            CompactSectionHeader(
                title: "Watched ports",
                trailing: self.statuses.isEmpty ? "All free" : "\(self.statuses.count) busy"
            )

            if self.statuses.isEmpty {
                Text("All \(self.store.snapshot.watchedPorts.count) watched ports are free.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("Blue means one of your Node apps is using the port. Orange means another app is blocking it.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(self.statuses.enumerated()), id: \.element.id) { index, status in
                        if index > 0 {
                            CompactRowDivider()
                        }

                        WatchedPortRow(
                            status: status,
                            isExpanded: self.expandedPort == status.port
                        ) {
                            if self.expandedPort == status.port {
                                self.expandedPort = nil
                            } else {
                                self.expandedPort = status.port
                            }
                        }
                        .padding(.vertical, 9)

                        if self.expandedPort == status.port {
                            WatchedPortDetails(
                                store: self.store,
                                status: status,
                                projects: SnapshotDetails.projects(
                                    for: status.port,
                                    from: self.store.snapshot.projects
                                ),
                                otherProcesses: SnapshotDetails.processes(
                                    for: status.port,
                                    from: self.visibleOtherProcesses
                                )
                            )
                            .padding(.leading, 18)
                            .padding(.top, 2)
                            .padding(.bottom, 12)
                        }
                    }
                }
            }
        }
        .onAppear {
            self.syncExpandedPort()
        }
        .onChange(of: self.statuses.map(\.port)) {
            self.syncExpandedPort()
        }
    }

    private func syncExpandedPort() {
        if let expandedPort, self.statuses.contains(where: { $0.port == expandedPort }) {
            return
        }
        self.expandedPort = self.statuses.first?.port
    }
}

private struct WatchedPortRow: View {
    let status: WatchedPortStatus
    let isExpanded: Bool
    let action: () -> Void

    var body: some View {
        Button(action: self.action) {
            HStack(alignment: .center, spacing: 10) {
                PortBadge(port: self.status.port, tone: self.tone)

                VStack(alignment: .leading, spacing: 2) {
                    Text(DisplayText.watchedPortHeadline(self.status))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text(DisplayText.watchedPortExplanation(self.status))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer(minLength: 10)

                StatusTag(text: self.tagText, tone: self.tone)

                Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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
            return "Blocked"
        }
        if self.status.isNodeOwned {
            return "Node app"
        }
        return "In use"
    }
}

private struct WatchedPortDetails: View {
    @ObservedObject var store: NodeTrackerStore
    let status: WatchedPortStatus
    let projects: [ProjectSnapshot]
    let otherProcesses: [TrackedProcessSnapshot]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if !self.projects.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(self.projects.enumerated()), id: \.element.id) { index, project in
                        if index > 0 {
                            CompactRowDivider()
                                .padding(.vertical, 8)
                        }
                        ProjectDetailBlock(store: self.store, project: project)
                    }
                }
            }

            if !self.otherProcesses.isEmpty {
                if !self.projects.isEmpty {
                    CompactRowDivider()
                }
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(self.otherProcesses.enumerated()), id: \.element.id) { index, process in
                        if index > 0 {
                            CompactRowDivider()
                                .padding(.vertical, 8)
                        }
                        ProcessDetailRow(store: self.store, process: process)
                    }
                }
            }
        }
        .padding(.leading, 12)
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(Color.primary.opacity(0.08))
                .frame(width: 1)
        }
    }
}

private struct ProjectDetailBlock: View {
    @ObservedObject var store: NodeTrackerStore
    let project: ProjectSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(self.project.displayName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                if self.project.isWorktreeLike {
                    StatusTag(text: "worktree", tone: .warning)
                }
                Spacer()
            }

            Text(DisplayText.path(self.project.projectRoot))
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)

            let processes = SnapshotDetails.sortedProcesses(self.project.processes)
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(processes.enumerated()), id: \.element.id) { index, process in
                    if index > 0 {
                        CompactRowDivider()
                            .padding(.vertical, 8)
                    }
                    ProcessDetailRow(store: self.store, process: process, showPortBadges: false)
                }
            }
        }
    }
}

private struct ProcessDetailRow: View {
    @ObservedObject var store: NodeTrackerStore
    let process: TrackedProcessSnapshot
    let showPortBadges: Bool

    init(store: NodeTrackerStore, process: TrackedProcessSnapshot, showPortBadges: Bool = false) {
        self.store = store
        self.process = process
        self.showPortBadges = showPortBadges
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(self.process.process.toolLabel)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text(self.metaText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let detail = DisplayText.processDetail(self.process.process) {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            HStack(spacing: 8) {
                if self.showPortBadges {
                    PortBadgeRow(ports: self.process.ports)
                }
                if let firstListener = self.process.listeners.first {
                    Text(firstListener.hostScope.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
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

    private var metaText: String {
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

private struct AdditionalNodePortsSection: View {
    let projects: [ProjectSnapshot]
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            DisclosureToggle(
                title: "Other active Node ports",
                countText: "\(self.projects.count)",
                isExpanded: self.$isExpanded
            )

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(self.sortedProjects().enumerated()), id: \.element.id) { index, project in
                        if index > 0 {
                            CompactRowDivider()
                        }
                        ActiveProjectSummaryRow(project: project)
                            .padding(.vertical, 8)
                    }
                }
            }
        }
    }

    private func sortedProjects() -> [ProjectSnapshot] {
        SnapshotDetails.sortedProjects(self.projects)
    }
}

private struct ActiveProjectSummaryRow: View {
    let project: ProjectSnapshot

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            PortBadgeRow(ports: project.ports)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text(self.project.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    if self.project.isWorktreeLike {
                        StatusTag(text: "worktree", tone: .warning)
                    }
                }
                Text(DisplayText.path(self.project.projectRoot))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Text(DisplayText.toolsSummary(self.project.processes))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
    }
}

private struct OtherListenersSection: View {
    let processes: [TrackedProcessSnapshot]
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            DisclosureToggle(
                title: "Other listeners",
                countText: "\(self.processes.count)",
                isExpanded: self.$isExpanded
            )

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(SnapshotDetails.sortedProcesses(self.processes).enumerated()), id: \.element.id) { index, process in
                        if index > 0 {
                            CompactRowDivider()
                        }
                        OtherListenerSummaryRow(process: process)
                            .padding(.vertical, 8)
                    }
                }
            }
        }
    }
}

private struct OtherListenerSummaryRow: View {
    let process: TrackedProcessSnapshot

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            PortBadgeRow(ports: self.process.ports)

            VStack(alignment: .leading, spacing: 2) {
                Text(self.process.process.toolLabel)
                    .font(.subheadline)
                    .fontWeight(.medium)
                if let detail = DisplayText.processDetail(self.process.process) {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }

            Spacer(minLength: 8)

            Text("PID \(self.process.process.pid)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
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

private struct DisclosureToggle: View {
    let title: String
    let countText: String
    @Binding var isExpanded: Bool

    var body: some View {
        Button {
            self.isExpanded.toggle()
        } label: {
            HStack(alignment: .firstTextBaseline) {
                Text(self.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                Text(self.countText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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
            return Color.blue.opacity(0.16)
        case .warning:
            return Color.orange.opacity(0.18)
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

private enum SnapshotDetails {
    static func processes(for port: Int, from processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        sortedProcesses(processes.compactMap { self.process($0, matching: port) })
    }

    static func projects(for port: Int, from projects: [ProjectSnapshot]) -> [ProjectSnapshot] {
        sortedProjects(projects.compactMap { project in
            let processes = project.processes.compactMap { self.process($0, matching: port) }
            guard !processes.isEmpty else { return nil }
            return ProjectSnapshot(
                projectRoot: project.projectRoot,
                displayName: project.displayName,
                processes: processes,
                ports: [port],
                isWorktreeLike: project.isWorktreeLike
            )
        })
    }

    static func projectsExcludingPorts(_ projects: [ProjectSnapshot], excludedPorts: Set<Int>) -> [ProjectSnapshot] {
        sortedProjects(projects.compactMap { project in
            let processes = project.processes.compactMap { self.process($0, excluding: excludedPorts) }
            guard !processes.isEmpty else { return nil }
            let ports = Array(Set(processes.flatMap(\.ports))).sorted()
            return ProjectSnapshot(
                projectRoot: project.projectRoot,
                displayName: project.displayName,
                processes: processes,
                ports: ports,
                isWorktreeLike: project.isWorktreeLike
            )
        })
    }

    static func processesExcludingPorts(_ processes: [TrackedProcessSnapshot], excludedPorts: Set<Int>) -> [TrackedProcessSnapshot] {
        sortedProcesses(processes.compactMap { self.process($0, excluding: excludedPorts) })
    }

    static func sortedProjects(_ projects: [ProjectSnapshot]) -> [ProjectSnapshot] {
        projects.sorted { lhs, rhs in
            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let nameComparison = lhs.displayName.localizedCaseInsensitiveCompare(rhs.displayName)
            if nameComparison != .orderedSame {
                return nameComparison == .orderedAscending
            }

            if lhs.isWorktreeLike != rhs.isWorktreeLike {
                return lhs.isWorktreeLike == false
            }

            return lhs.projectRoot < rhs.projectRoot
        }
    }

    static func sortedProcesses(_ processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
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

    private static func process(_ process: TrackedProcessSnapshot, matching port: Int) -> TrackedProcessSnapshot? {
        let listeners = process.listeners.filter { $0.port == port }
        let ports = process.ports.filter { $0 == port }
        guard !ports.isEmpty else { return nil }
        return TrackedProcessSnapshot(
            process: process.process,
            listeners: listeners,
            ports: ports,
            isWatchedConflict: process.isWatchedConflict
        )
    }

    private static func process(_ process: TrackedProcessSnapshot, excluding excludedPorts: Set<Int>) -> TrackedProcessSnapshot? {
        let listeners = process.listeners.filter { !excludedPorts.contains($0.port) }
        let ports = process.ports.filter { !excludedPorts.contains($0) }
        guard !ports.isEmpty else { return nil }
        return TrackedProcessSnapshot(
            process: process.process,
            listeners: listeners,
            ports: Array(Set(ports)).sorted(),
            isWatchedConflict: process.isWatchedConflict
        )
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

    static func watchedPortHeadline(_ status: WatchedPortStatus) -> String {
        let owner = self.watchedPortOwner(status)
        if status.isConflict {
            return "Blocked by \(owner)"
        }
        if status.isNodeOwned {
            return "Used by \(owner)"
        }
        return "In use by \(owner)"
    }

    static func watchedPortExplanation(_ status: WatchedPortStatus) -> String {
        if status.isConflict {
            return "Another app is already using this watched port"
        }
        if status.isNodeOwned {
            return "A Node process is currently using this watched port"
        }
        return "This watched port is already in use"
    }

    static func processDetail(_ process: ProcessSnapshot) -> String? {
        let command = self.command(process)
        let executablePath = self.executablePath(process.commandLine)

        if command.localizedCaseInsensitiveCompare(process.toolLabel) == .orderedSame {
            if executablePath != command {
                return executablePath
            }
            return nil
        }

        return command
    }

    static func toolsSummary(_ processes: [TrackedProcessSnapshot]) -> String {
        let tools = Array(Set(processes.map(\.process.toolLabel))).sorted()
        return tools.joined(separator: " • ")
    }

    private static func watchedPortOwner(_ status: WatchedPortStatus) -> String {
        let owners = status.ownerSummary
            .split(separator: ",")
            .map { stripPID(from: $0.trimmingCharacters(in: .whitespacesAndNewlines)) }

        guard let firstOwner = owners.first, !firstOwner.isEmpty else {
            return "another process"
        }

        if owners.count == 1 {
            return firstOwner
        }

        return "\(firstOwner) +\(owners.count - 1)"
    }

    private static func command(_ process: ProcessSnapshot) -> String {
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

    private static func executablePath(_ commandLine: String) -> String {
        let token = commandLine.split(whereSeparator: \.isWhitespace).first.map(String.init) ?? commandLine
        if token.hasPrefix("/") {
            return path(token)
        }
        return token
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
