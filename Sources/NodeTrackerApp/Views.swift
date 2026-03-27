import AppKit
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
        let conflicts = self.store.snapshot.watchedPorts.filter(\.isConflict)
            .sorted(by: DisplayText.compareWatchedPorts)
        let nodeOwnedPorts = self.store.snapshot.watchedPorts
            .filter { $0.isBusy && $0.isNodeOwned && !$0.isConflict }
            .sorted(by: DisplayText.compareWatchedPorts)
        let allProjects = SnapshotDetails.sortedProjects(self.store.snapshot.projects)
        let visibleOtherProcesses = self.store.visibleOtherProcesses()

        ZStack {
            PopoverMaterialBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    CompactHeader(
                        snapshot: self.store.snapshot,
                        useSampleData: self.store.useSampleData,
                        conflictCount: conflicts.count,
                        projectCount: allProjects.count
                    )

                    if !conflicts.isEmpty {
                        ConflictSection(
                            store: self.store,
                            conflicts: conflicts,
                            visibleOtherProcesses: visibleOtherProcesses
                        )
                    }

                    if !allProjects.isEmpty || !nodeOwnedPorts.isEmpty {
                        Divider()
                        ProjectDashboardSection(
                            store: self.store,
                            projects: allProjects,
                            nodeOwnedPorts: nodeOwnedPorts
                        )
                    }

                    if !self.store.snapshot.nodeProcessGroups.isEmpty {
                        Divider()
                        NodeProcessSection(
                            store: self.store,
                            groups: self.store.snapshot.nodeProcessGroups,
                            summary: self.store.snapshot.summary
                        )
                    }

                    if self.settings.showNonNodeListeners, !visibleOtherProcesses.isEmpty {
                        Divider()
                        OtherListenersSection(processes: visibleOtherProcesses)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
            }
        }
        .frame(width: 340)
        .frame(maxHeight: 500)
        .overlay(alignment: .bottomTrailing) {
            if let notice = self.store.clipboardNotice {
                Text(notice)
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background {
                        PopoverCapsuleBackground()
                            .clipShape(Capsule())
                    }
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

// MARK: - Zone 1: Conflict Triage

private struct ConflictSection: View {
    @ObservedObject var store: NodeTrackerStore
    let conflicts: [WatchedPortStatus]
    let visibleOtherProcesses: [TrackedProcessSnapshot]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if self.conflicts.count > 1 {
                HStack {
                    Spacer()
                    InlineAccentButton("Copy all fixes", tone: .conflict) {
                        self.store.copyAllSuggestedPorts()
                    }
                }
            }

            ForEach(self.conflicts, id: \.id) { status in
                ConflictCard(
                    store: self.store,
                    status: status,
                    otherProcesses: SnapshotDetails.processes(
                        for: status.port,
                        from: self.visibleOtherProcesses
                    ),
                    projects: SnapshotDetails.projects(
                        for: status.port,
                        from: self.store.snapshot.projects
                    )
                )
            }
        }
    }
}

private struct ConflictCard: View {
    @ObservedObject var store: NodeTrackerStore
    let status: WatchedPortStatus
    let otherProcesses: [TrackedProcessSnapshot]
    let projects: [ProjectSnapshot]

    var body: some View {
        HStack(spacing: 8) {
            PortBadge(port: self.status.port, tone: .conflict)

            VStack(alignment: .leading, spacing: 0) {
                Text(DisplayText.watchedPortHeadline(self.status))
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)
                if let process = self.primaryBlocker {
                    Text(DisplayText.blockerDetail(process))
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }

            Spacer(minLength: 4)

            self.actionButton
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color.primary.opacity(0.04), in: RoundedRectangle(cornerRadius: 7))
        .overlay(
            RoundedRectangle(cornerRadius: 7)
                .stroke(Palette.mutedRed.opacity(0.30), lineWidth: 0.5)
        )
    }

    @ViewBuilder
    private var actionButton: some View {
        if let process = self.primaryBlocker,
           let resolution = ResolutionAdvisor.primaryAction(for: process, portContext: self.status.port) {
            switch resolution.kind {
            case .terminate:
                InlineAccentButton(resolution.title, tone: resolution.tone) {
                    self.store.terminate(process: process)
                }
            case let .openApplication(path):
                InlineAccentButton(resolution.title, tone: resolution.tone) {
                    self.store.openApplication(at: path)
                }
            }
        } else if let suggested = self.store.nextAvailablePort(after: self.status.port) {
            InlineAccentButton("Use \(suggested)", tone: .node) {
                self.store.copySuggestedPort(after: self.status.port)
            }
        }
    }

    private var primaryBlocker: TrackedProcessSnapshot? {
        self.otherProcesses.first ?? self.projects.flatMap(\.processes).first
    }
}

// MARK: - Zone 2: Project Dashboard

private struct ProjectDashboardSection: View {
    @ObservedObject var store: NodeTrackerStore
    let projects: [ProjectSnapshot]
    let nodeOwnedPorts: [WatchedPortStatus]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(self.projects.enumerated()), id: \.element.id) { index, project in
                    if index > 0 {
                        CompactRowDivider()
                    }
                    ProjectDashboardRow(store: self.store, project: project)
                        .padding(.vertical, 5)
                }
            }
        }
    }
}

private struct ProjectDashboardRow: View {
    @ObservedObject var store: NodeTrackerStore
    let project: ProjectSnapshot
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                self.isExpanded.toggle()
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Circle()
                        .fill(Palette.mutedGreen)
                        .frame(width: 6, height: 6)

                    Text(self.project.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.primary)
                        .lineLimit(1)

                    if self.project.isWorktreeLike {
                        StatusTag(text: "worktree", tone: .neutral)
                    }

                    Text(DisplayText.toolsSummary(self.project.processes))
                        .font(.caption)
                        .foregroundStyle(Readability.secondaryText)
                        .lineLimit(1)

                    Spacer(minLength: 4)

                    PortBadgeRow(ports: self.project.ports)

                    Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 4) {
                    Text(DisplayText.path(self.project.projectRoot))
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                        .lineLimit(1)
                        .truncationMode(.middle)

                    let processes = SnapshotDetails.sortedProcesses(self.project.processes)
                    ForEach(processes, id: \.id) { process in
                        ProcessDetailRow(
                            store: self.store,
                            process: process,
                            portContext: self.project.ports.first
                        )
                    }
                }
                .padding(.leading, 14)
                .padding(.top, 4)
                .overlay(alignment: .leading) {
                    Rectangle()
                        .fill(Color.primary.opacity(0.08))
                        .frame(width: 1)
                }
            }
        }
    }
}

// MARK: - Node Process Groups

private struct NodeProcessSection: View {
    @ObservedObject var store: NodeTrackerStore
    let groups: [NodeProcessGroup]
    let summary: SnapshotSummary
    @State private var isExpanded = true

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button {
                self.isExpanded.toggle()
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Text("Node processes")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(Readability.secondaryText)
                    Text("\(self.summary.nodeProcessTotalCount)")
                        .font(.caption)
                        .foregroundStyle(Readability.secondaryText)
                    Text("\u{00B7}")
                        .foregroundStyle(Readability.secondaryText)
                    Text(self.formattedTotalMemory)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(
                            self.summary.nodeProcessTotalMemoryBytes > 2 * 1024 * 1024 * 1024
                                ? Palette.mutedRed
                                : Readability.secondaryText
                        )
                    Spacer()
                    Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(self.groups) { group in
                        NodeProcessGroupRow(store: self.store, group: group)
                    }
                }
            }
        }
    }

    private var formattedTotalMemory: String {
        let mb = Double(self.summary.nodeProcessTotalMemoryBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }
}

private struct NodeProcessGroupRow: View {
    @ObservedObject var store: NodeTrackerStore
    let group: NodeProcessGroup

    var body: some View {
        HStack(alignment: .center, spacing: 6) {
            Text("\(self.group.count)\u{00D7}")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)
                .frame(width: 28, alignment: .trailing)

            Text(self.group.toolLabel)
                .font(.caption)
                .fontWeight(.medium)
                .lineLimit(1)

            Spacer(minLength: 4)

            Text(self.group.formattedMemory)
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)

            InlineAccentButton("Kill all", tone: .conflict) {
                self.store.terminateGroup(self.group)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Process Detail (collapsed by default)

private struct ProcessDetailRow: View {
    @ObservedObject var store: NodeTrackerStore
    let process: TrackedProcessSnapshot
    let portContext: Int?

    @State private var showDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(self.process.process.toolLabel)
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer(minLength: 8)

                if let resolution = self.primaryResolution {
                    InlineAccentButton(resolution.title, tone: resolution.tone) {
                        self.run(resolution)
                    }
                }

                Button {
                    self.showDetails.toggle()
                } label: {
                    HStack(spacing: 2) {
                        Image(systemName: "ellipsis")
                            .font(.caption2)
                    }
                    .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }

            if self.showDetails {
                VStack(alignment: .leading, spacing: 3) {
                    Text("PID \(self.process.process.pid) \u{00B7} \(self.process.process.uptime)")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)

                    if let detail = DisplayText.processDetail(self.process.process) {
                        Text(detail)
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }

                    HStack(spacing: 10) {
                        if ProcessActionPolicy.hasMeaningfulDirectory(self.process) {
                            InlineTextButton("Reveal") {
                                self.store.reveal(path: self.process.process.cwd)
                            }
                            if self.process.process.isNodeFamily {
                                InlineTextButton("Terminal") {
                                    self.store.openTerminal(path: self.process.process.cwd)
                                }
                            }
                        }
                        ProcessActionsMenu(
                            store: self.store,
                            process: self.process,
                            canTerminate: ProcessActionPolicy.canTerminate(self.process)
                        )
                    }
                }
            }
        }
    }

    private var primaryResolution: ResolutionAction? {
        ResolutionAdvisor.primaryAction(for: self.process, portContext: self.portContext)
    }

    private func run(_ action: ResolutionAction) {
        switch action.kind {
        case .terminate:
            self.store.terminate(process: self.process)
        case let .openApplication(path):
            self.store.openApplication(at: path)
        }
    }
}

// MARK: - Other Listeners (optional)

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

// MARK: - Header

private struct CompactHeader: View {
    let snapshot: AppSnapshot
    let useSampleData: Bool
    let conflictCount: Int
    let projectCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("NodeWatcher")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text(self.useSampleData ? "Sample data mode" : self.relativeUpdatedText)
                    .font(.caption)
                    .foregroundStyle(Readability.secondaryText)
            }

            self.summaryLine
                .font(.caption)
                .foregroundStyle(.primary)
        }
    }

    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    private var relativeUpdatedText: String {
        let elapsed = Date().timeIntervalSince(self.snapshot.generatedAt)
        guard elapsed > 3 else { return "Updated just now" }
        return "Updated \(Self.relativeDateFormatter.localizedString(fromTimeInterval: -elapsed))"
    }

    private var summaryLine: Text {
        var parts: [Text] = []
        if self.conflictCount > 0 {
            parts.append(
                Text("\(self.conflictCount) conflict\(self.conflictCount == 1 ? "" : "s")")
                    .foregroundColor(Palette.mutedRed)
                    .fontWeight(.medium)
            )
        }
        if self.projectCount > 0 {
            parts.append(Text("\(self.projectCount) running"))
        }
        let separator = Text("  \u{00B7}  ").foregroundColor(Readability.secondaryText)
        var result = Text("")
        for (i, part) in parts.enumerated() {
            if i > 0 { result = result + separator }
            result = result + part
        }
        return result
    }
}

// MARK: - Shared Components

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
                    .foregroundStyle(Readability.secondaryText)
                Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}


private struct CompactRowDivider: View {
    var body: some View {
        Divider()
            .overlay(Color.primary.opacity(0.06))
    }
}

// MARK: - Accent & Styling

private enum AccentTone {
    case neutral
    case node
    case conflict

    var fill: Color {
        switch self {
        case .neutral: Color.primary.opacity(0.06)
        case .node: Palette.softGreenFill
        case .conflict: Palette.softRedFill
        }
    }

    var foreground: Color {
        switch self {
        case .neutral: .primary
        case .node: Palette.mutedGreen
        case .conflict: Palette.mutedRed
        }
    }

    var solidBackground: Color {
        switch self {
        case .node: Palette.mutedGreen
        case .conflict: Palette.mutedRed
        case .neutral: Color.primary.opacity(0.45)
        }
    }
}

private enum Palette {
    static let mutedRed = Color(nsColor: NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1))
    static let mutedGreen = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1))
    static let softGreenFill = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1)).opacity(0.10)
    static let softRedFill = Color(nsColor: NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1)).opacity(0.10)
}

private enum Readability {
    static let secondaryText = Color.primary.opacity(0.78)
}

private struct PortBadge: View {
    let port: Int
    let tone: AccentTone

    var body: some View {
        Text(verbatim: String(self.port))
            .font(.system(.caption2, design: .monospaced))
            .fontWeight(.semibold)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
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
            .font(.system(size: 9, weight: .semibold))
            .foregroundStyle(self.tone.foreground)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
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
                .foregroundStyle(Readability.secondaryText)
        }
        .buttonStyle(.plain)
    }
}

private struct InlineAccentButton: View {
    let title: String
    let tone: AccentTone
    let action: () -> Void

    init(_ title: String, tone: AccentTone, action: @escaping () -> Void) {
        self.title = title
        self.tone = tone
        self.action = action
    }

    var body: some View {
        Button(action: self.action) {
            Text(self.title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Color.white.opacity(0.70))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(self.tone.solidBackground, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Visual Effects

private struct PopoverMaterialBackground: View {
    var body: some View {
        ZStack {
            VisualEffectView(material: .popover, blendingMode: .behindWindow, state: .active)
            Color.white.opacity(0.10)
        }
        .ignoresSafeArea()
    }
}

private struct PopoverCapsuleBackground: View {
    var body: some View {
        ZStack {
            VisualEffectView(material: .sidebar, blendingMode: .withinWindow, state: .active)
            Color.white.opacity(0.12)
        }
    }
}

private struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode
    let state: NSVisualEffectView.State

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = self.material
        view.blendingMode = self.blendingMode
        view.state = self.state
        view.isEmphasized = false
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = self.material
        nsView.blendingMode = self.blendingMode
        nsView.state = self.state
        nsView.isEmphasized = false
    }
}

// MARK: - Business Logic

private enum ProcessActionPolicy {
    static func hasMeaningfulDirectory(_ process: TrackedProcessSnapshot) -> Bool {
        guard let cwd = process.process.cwd, cwd != "/" else { return false }
        return FileManager.default.fileExists(atPath: cwd)
    }

    static func canTerminate(_ process: TrackedProcessSnapshot) -> Bool {
        if process.process.isNodeFamily {
            return true
        }

        guard hasMeaningfulDirectory(process) else { return false }

        let command = process.process.commandLine
        if command.hasPrefix("/System/") || command.hasPrefix("/usr/") || command.hasPrefix("/Applications/") {
            return false
        }

        return true
    }
}

private struct ResolutionAction {
    enum Kind {
        case terminate
        case openApplication(String)
    }

    let title: String
    let tone: AccentTone
    let kind: Kind
}

private enum ResolutionAdvisor {
    static func primaryAction(for process: TrackedProcessSnapshot, portContext: Int?) -> ResolutionAction? {
        let command = process.process.commandLine
        let lowercasedCommand = command.lowercased()
        let tool = process.process.toolLabel.lowercased()

        if process.process.isNodeFamily, portContext != nil {
            return ResolutionAction(title: "Free port", tone: .node, kind: .terminate)
        }

        if tool == "ssh" || lowercasedCommand.hasPrefix("ssh ") {
            return ResolutionAction(title: "Stop tunnel", tone: .conflict, kind: .terminate)
        }

        if let bundlePath = self.applicationBundlePath(from: command),
           bundlePath.localizedCaseInsensitiveContains("/Docker.app") {
            return ResolutionAction(title: "Open Docker", tone: .neutral, kind: .openApplication(bundlePath))
        }

        if ProcessActionPolicy.canTerminate(process) {
            return ResolutionAction(title: "Stop blocker", tone: .conflict, kind: .terminate)
        }

        return nil
    }

    private static func applicationBundlePath(from commandLine: String) -> String? {
        let pattern = #"(/[^ ]+?\.app)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(commandLine.startIndex..<commandLine.endIndex, in: commandLine)
        guard let match = regex.firstMatch(in: commandLine, range: range),
              let resultRange = Range(match.range(at: 1), in: commandLine) else {
            return nil
        }
        return String(commandLine[resultRange])
    }
}

// MARK: - Data Helpers

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
}

// MARK: - Display Text

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

    static func blockerDetail(_ process: TrackedProcessSnapshot) -> String {
        let pid = "PID \(process.process.pid)"
        if let cwd = process.process.cwd, cwd != "/" {
            return "\(pid) \u{00B7} \(self.path(cwd))"
        }
        return pid
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
        return tools.joined(separator: " \u{2022} ")
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
        return tokens.prefix(6).joined(separator: " ") + " \u{2026}"
    }
}

// MARK: - Settings

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
