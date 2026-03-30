import AppKit
import SwiftUI
import PortpourriCore

struct PopoverRootView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject private var settings: SettingsStore

    init(store: PortpourriStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    @State private var showProcessDrawer = false
    @State private var showAITools = false

    var body: some View {
        let allWatchedPorts = self.store.snapshot.watchedPorts
            .sorted(by: DisplayText.compareWatchedPorts)
        let visibleOtherProcesses = self.store.visibleOtherProcesses()
        let significantGroups = self.store.activeListenerGroups.filter { $0.count >= 3 }
        let conflictCount = allWatchedPorts.filter(\.isConflict).count
        let projectCount = SnapshotDetails.sortedProjects(self.store.snapshot.projects).count
        let aiSnapshot = self.store.aiSnapshot
        let hasAITools = !aiSnapshot.claudeWorktrees.isEmpty || !aiSnapshot.codexWorktrees.isEmpty

        ZStack {
            PopoverMaterialBackground()

            VStack(alignment: .leading, spacing: 8) {
                // 1. Header
                CompactHeader(
                    snapshot: self.store.snapshot,
                    useSampleData: self.store.useSampleData,
                    conflictCount: conflictCount,
                    projectCount: projectCount
                )

                // 2. Watched Ports
                if !allWatchedPorts.isEmpty {
                    WatchedPortsSection(
                        store: self.store,
                        watchedPorts: allWatchedPorts,
                        otherProcesses: visibleOtherProcesses
                    )
                }

                // 3. Other listeners / Blockers
                if self.settings.showNonNodeListeners, !visibleOtherProcesses.isEmpty {
                    Divider()
                    OtherListenersSection(processes: visibleOtherProcesses)
                }

                // 4. Process groups
                if !significantGroups.isEmpty {
                    Divider()
                    NodeProcessDrawerToggle(
                        groups: significantGroups,
                        significantGroupCount: significantGroups.count,
                        isOpen: self.$showProcessDrawer
                    )

                    if self.showProcessDrawer {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 2) {
                                ForEach(significantGroups) { group in
                                    NodeProcessGroupRow(store: self.store, group: group)
                                }
                            }
                        }
                        .frame(maxHeight: 160)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }

                // 5. AI tools
                if hasAITools {
                    Divider()
                    AIToolsSection(aiSnapshot: aiSnapshot, isExpanded: self.$showAITools)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .animation(.easeInOut(duration: 0.2), value: self.showProcessDrawer)
            .animation(.easeInOut(duration: 0.2), value: self.showAITools)
        }
        .frame(width: 340)
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

// MARK: - Zone 1: Watched Ports

private struct WatchedPortsSection: View {
    @ObservedObject var store: PortpourriStore
    let watchedPorts: [WatchedPortStatus]
    let otherProcesses: [TrackedProcessSnapshot]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(self.watchedPorts, id: \.id) { status in
                WatchedPortRow(
                    store: self.store,
                    status: status,
                    otherProcesses: SnapshotDetails.processes(
                        for: status.port,
                        from: self.otherProcesses
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

private struct WatchedPortRow: View {
    @ObservedObject var store: PortpourriStore
    let status: WatchedPortStatus
    let otherProcesses: [TrackedProcessSnapshot]
    let projects: [ProjectSnapshot]

    private var dotState: WatchedPortDotState {
        WatchedPortDotState(from: self.status)
    }

    private var portTone: AccentTone {
        switch self.dotState {
        case .free: .neutral
        case .owned: .node
        case .blocked: .amber
        case .conflict: .conflict
        }
    }

    var body: some View {
        HStack(spacing: 8) {
            PortBadge(port: self.status.port, tone: self.portTone)

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
                .stroke(self.borderColor.opacity(0.30), lineWidth: 0.5)
        )
    }

    private var borderColor: Color {
        switch self.dotState {
        case .conflict: Palette.mutedRed
        case .blocked: Palette.mutedAmber
        case .owned: Palette.mutedGreen
        case .free: Color.primary
        }
    }

    @ViewBuilder
    private var actionButton: some View {
        if let process = self.primaryBlocker,
           let resolution = ResolutionAdvisor.primaryAction(for: process, portContext: self.status.port) {
            switch resolution.kind {
            case .terminate:
                InlineAccentButton(resolution.title, tone: resolution.tone) {
                    self.store.terminate(process: process, portContext: self.status.port)
                }
            case let .openApplication(path):
                InlineAccentButton(resolution.title, tone: resolution.tone) {
                    self.store.openApplication(at: path)
                }
            }
        } else if self.status.isConflict, let suggested = self.store.nextAvailablePort(after: self.status.port) {
            InlineAccentButton("Use \(suggested)", tone: .node) {
                self.store.copySuggestedPort(after: self.status.port)
            }
        }
    }

    private var primaryBlocker: TrackedProcessSnapshot? {
        self.otherProcesses.first ?? self.projects.flatMap(\.processes).first
    }
}

// MARK: - Zone 2: Project Dashboard (kept for expanded process details)

private struct ProjectDashboardSection: View {
    @ObservedObject var store: PortpourriStore
    let projects: [ProjectSnapshot]

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
    @ObservedObject var store: PortpourriStore
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

private struct NodeProcessDrawerToggle: View {
    let groups: [ActiveListenerGroup]
    let significantGroupCount: Int
    @Binding var isOpen: Bool

    var body: some View {
        Button {
            self.isOpen.toggle()
        } label: {
            HStack(alignment: .center, spacing: 6) {
                Text("Process groups")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(Readability.secondaryText)
                Text("\(self.totalProcessCount)")
                    .font(.caption)
                    .foregroundStyle(Readability.secondaryText)
                Text("\u{00B7}")
                    .foregroundStyle(Readability.secondaryText)
                Text("\(self.significantGroupCount) group\(self.significantGroupCount == 1 ? "" : "s")")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(Readability.secondaryText)
                Spacer()
                Image(systemName: self.isOpen ? "chevron.down" : "chevron.up")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var totalProcessCount: Int {
        self.groups.reduce(0) { $0 + $1.count }
    }
}

private struct NodeProcessGroupRow: View {
    @ObservedObject var store: PortpourriStore
    let group: ActiveListenerGroup

    var body: some View {
        HStack(alignment: .center, spacing: 6) {
            Text("\(self.group.count)\u{00D7}")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)
                .frame(width: 28, alignment: .trailing)

            VStack(alignment: .leading, spacing: 1) {
                Text(self.group.toolLabel)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Text(self.group.displayName)
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                        .lineLimit(1)
                    if self.group.isWorktreeLike {
                        StatusTag(text: "worktree", tone: .neutral)
                    }
                }
            }

            Spacer(minLength: 4)

            Text(self.groupPortSummary)
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)

            InlineAccentButton("Kill group", tone: .conflict) {
                self.store.terminateGroup(self.group)
            }
        }
        .padding(.vertical, 2)
    }

    private var groupPortSummary: String {
        let ports = Set(self.group.processes.flatMap(\.ports)).sorted()
        guard !ports.isEmpty else { return "listeners" }
        return ports.map(String.init).joined(separator: ",")
    }
}

// MARK: - Process Detail (collapsed by default)

private struct ProcessDetailRow: View {
    @ObservedObject var store: PortpourriStore
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
                            portContext: self.portContext,
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
            self.store.terminate(process: self.process, portContext: self.portContext)
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
                Text("Portpourri")
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
    @ObservedObject var store: PortpourriStore
    let process: TrackedProcessSnapshot
    let portContext: Int?
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
                Button(self.terminateLabel, role: .destructive) {
                    self.store.terminate(process: self.process, portContext: self.portContext)
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

    private var terminateLabel: String {
        DestructiveActionAdvisor.kind(for: self.process, portContext: self.portContext)?.label ?? "Stop process"
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
    case amber
    case conflict

    var fill: Color {
        switch self {
        case .neutral: Color.primary.opacity(0.06)
        case .node: Palette.softGreenFill
        case .amber: Palette.softAmberFill
        case .conflict: Palette.softRedFill
        }
    }

    var foreground: Color {
        switch self {
        case .neutral: .primary
        case .node: Palette.mutedGreen
        case .amber: Palette.mutedAmber
        case .conflict: Palette.mutedRed
        }
    }

    var solidBackground: Color {
        switch self {
        case .node: Palette.mutedGreen
        case .amber: Palette.mutedAmber
        case .conflict: Palette.mutedRed
        case .neutral: Color.primary.opacity(0.45)
        }
    }
}

private enum Palette {
    static let mutedRed = Color(nsColor: NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1))
    static let mutedGreen = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1))
    static let mutedAmber = Color(nsColor: NSColor(calibratedRed: 0.75, green: 0.55, blue: 0.20, alpha: 1))
    static let softGreenFill = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1)).opacity(0.10)
    static let softAmberFill = Color(nsColor: NSColor(calibratedRed: 0.75, green: 0.55, blue: 0.20, alpha: 1)).opacity(0.10)
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

// MARK: - AI Tools Section

private struct AIToolsSection: View {
    let aiSnapshot: AIToolSnapshot
    @Binding var isExpanded: Bool

    private var totalWorktrees: Int {
        self.aiSnapshot.claudeWorktrees.count + self.aiSnapshot.codexWorktrees.count
    }

    private var formattedSize: String {
        let mb = Double(self.aiSnapshot.totalSizeBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            DisclosureToggle(
                title: "AI tools",
                countText: "\(self.totalWorktrees) worktree\(self.totalWorktrees == 1 ? "" : "s") \u{00B7} \(self.formattedSize)",
                isExpanded: self.$isExpanded
            )

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 4) {
                    if !self.aiSnapshot.claudeWorktrees.isEmpty {
                        AIToolGroupView(
                            label: "Claude Code",
                            sessionCount: self.aiSnapshot.claudeSessionCount,
                            worktrees: self.aiSnapshot.claudeWorktrees
                        )
                    }
                    if !self.aiSnapshot.codexWorktrees.isEmpty {
                        AIToolGroupView(
                            label: "Codex",
                            sessionCount: self.aiSnapshot.codexSessionCount,
                            worktrees: self.aiSnapshot.codexWorktrees
                        )
                    }
                }
                .padding(.leading, 4)
            }
        }
    }
}

private struct AIToolGroupView: View {
    let label: String
    let sessionCount: Int
    let worktrees: [AIWorktreeEntry]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(self.label)
                    .font(.caption)
                    .fontWeight(.medium)
                Text("\(self.worktrees.count) worktree\(self.worktrees.count == 1 ? "" : "s") \u{00B7} \(self.sessionCount) session\(self.sessionCount == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            ForEach(self.worktrees, id: \.path) { wt in
                HStack(spacing: 6) {
                    Text(wt.name)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    if let project = wt.projectName {
                        Text(project)
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                            .lineLimit(1)
                    }
                    if Self.isStale(wt) {
                        StatusTag(text: "stale", tone: .amber)
                    }
                    Spacer(minLength: 4)
                    Text(Self.formattedSize(wt.sizeBytes))
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(Readability.secondaryText)
                }
            }
        }
    }

    private static func isStale(_ entry: AIWorktreeEntry) -> Bool {
        let days = Calendar.current.dateComponents([.day], from: entry.lastModified, to: Date()).day ?? 0
        return days >= 3
    }

    private static func formattedSize(_ bytes: Int64) -> String {
        let mb = Double(bytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }
}

// MARK: - Business Logic

private typealias ProcessActionPolicy = DestructiveActionPolicy

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

        // Docker-owned ports (postgres, redis, etc.) are typically intentional
        // infrastructure — no action button, just informational display.
        if self.applicationBundlePath(from: command)?.localizedCaseInsensitiveContains("/Docker.app") == true {
            return nil
        }

        if let kind = DestructiveActionAdvisor.kind(for: process, portContext: portContext) {
            let tone: AccentTone
            switch kind {
            case .stopServer:
                tone = .node
            case .freePort, .stopTunnel, .stopBlocker, .killGroup:
                tone = .conflict
            }
            return ResolutionAction(title: kind.label, tone: tone, kind: .terminate)
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
    @ObservedObject var store: PortpourriStore
    @ObservedObject private var settings: SettingsStore

    init(store: PortpourriStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    var body: some View {
        TabView {
            GeneralSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("General", systemImage: "gearshape") }
            DisplaySettingsView(settings: self.settings, snapshot: self.store.snapshot)
                .tabItem { Label("Display", systemImage: "eye") }
            PortsSettingsView(settings: self.settings)
                .tabItem { Label("Ports", systemImage: "network") }
            AdvancedSettingsView(store: self.store)
                .tabItem { Label("Advanced", systemImage: "wrench") }
            AboutSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .padding(20)
        .frame(width: 560, height: 480)
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject var settings: SettingsStore

    private static let modifierOptions = ["ctrl+shift", "cmd+shift", "cmd+opt", "ctrl+opt"]
    private static let keyOptions = ["P", "N", "W", "K", "J"]

    private var hotkeyDisplay: String {
        StatusBarController.modifierSymbols(self.settings.hotkeyModifiers) + self.settings.hotkeyKey.uppercased()
    }

    var body: some View {
        Form {
            Section("Startup") {
                Toggle("Start at login", isOn: self.$settings.launchAtLogin)
            }

            Section("Refresh") {
                Picker("Refresh cadence", selection: self.$settings.refreshCadence) {
                    ForEach(RefreshCadence.allCases) { cadence in
                        Text(cadence.label).tag(cadence)
                    }
                }
                Text("How often to scan for Node processes when the popover is closed.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Keyboard Shortcut") {
                HStack {
                    Picker("Modifiers", selection: self.$settings.hotkeyModifiers) {
                        ForEach(Self.modifierOptions, id: \.self) { mod in
                            Text(StatusBarController.modifierSymbols(mod))
                                .tag(mod)
                        }
                    }
                    .frame(width: 140)

                    Picker("Key", selection: self.$settings.hotkeyKey) {
                        ForEach(Self.keyOptions, id: \.self) { key in
                            Text(key).tag(key)
                        }
                    }
                    .frame(width: 100)

                    Spacer()

                    Text(self.hotkeyDisplay)
                        .font(.system(.body, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.quaternary)
                        .cornerRadius(6)
                }
                Text("Global shortcut to toggle the Portpourri popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Safety") {
                Toggle("Confirm destructive actions", isOn: self.$settings.confirmBeforeTerminate)
                Text("Shows action-specific confirmation copy for Stop server, Free port, Stop tunnel, and Kill group.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Notifications") {
                Toggle("Notify on port conflicts", isOn: self.$settings.enableConflictNotifications)
                Toggle("Play notification sound", isOn: self.$settings.notificationSound)
                    .disabled(!self.settings.enableConflictNotifications)
                Text("Notifications appear when a non-Node process occupies a watched port.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if self.store.useSampleData {
                Section {
                    Label("Running in sample-data mode", systemImage: "testtube.2")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            if let error = self.store.lastError {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
        }
        .formStyle(.grouped)
    }
}

private struct DisplaySettingsView: View {
    @ObservedObject var settings: SettingsStore
    let snapshot: AppSnapshot

    var body: some View {
        Form {
            Section("Menu Bar") {
                Picker("Menu bar display", selection: self.$settings.menuBarDisplayMode) {
                    ForEach(MenuBarDisplayMode.allCases) { mode in
                        HStack {
                            Text(mode.label)
                            Spacer()
                            Text(mode.description)
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .tag(mode)
                    }
                }

                // Live preview
                HStack {
                    Text("Preview")
                        .foregroundStyle(.secondary)
                    Spacer()
                    MenuBarPreview(
                        displayMode: self.settings.menuBarDisplayMode,
                        summary: self.snapshot.summary,
                        watchedPorts: self.snapshot.watchedPorts
                    )
                }

                Toggle("Show conflict badge", isOn: self.$settings.showConflictBadge)
                Toggle("Hide icon when idle", isOn: self.$settings.hideWhenIdle)
                Text("Hides the menu bar icon when no Node processes are running.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if self.settings.menuBarDisplayMode == .dotMatrix {
                Section("Dot Matrix Legend") {
                    HStack(spacing: 16) {
                        DotLegendItem(color: Palette.mutedGreen, label: "Your project")
                        DotLegendItem(color: Palette.mutedAmber, label: "Non-owned")
                        DotLegendItem(color: Palette.mutedRed, label: "Conflict")
                        DotLegendItem(color: Color.primary.opacity(0.25), label: "Free")
                    }
                    Text("Top row = active projects. Bottom row = watched port status.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Popover") {
                Picker("Group content by", selection: self.$settings.groupMode) {
                    ForEach(GroupMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                Toggle("Show non-Node listeners", isOn: self.$settings.showNonNodeListeners)
            }
        }
        .formStyle(.grouped)
    }
}

private struct DotLegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(self.color)
                .frame(width: 6, height: 6)
            Text(self.label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

private struct MenuBarPreview: View {
    let displayMode: MenuBarDisplayMode
    let summary: SnapshotSummary
    let watchedPorts: [WatchedPortStatus]

    var body: some View {
        HStack(spacing: 2) {
            if self.displayMode == .dotMatrix {
                self.dotMatrixPreview
            } else {
                Text(StatusChipRenderer.statusText(for: self.summary, displayMode: self.displayMode))
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.medium)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(.quaternary)
        .cornerRadius(6)
    }

    @ViewBuilder
    private var dotMatrixPreview: some View {
        let ports = Array(self.watchedPorts.sorted(by: { $0.port < $1.port }).prefix(5))
        let projects = min(self.summary.nodeProjectCount, 5)
        VStack(spacing: 2) {
            HStack(spacing: 2) {
                ForEach(0..<max(ports.count, projects, 1), id: \.self) { i in
                    Circle()
                        .fill(i < projects ? Palette.mutedGreen : Color.clear)
                        .frame(width: 4, height: 4)
                }
            }
            HStack(spacing: 2) {
                ForEach(Array(ports.enumerated()), id: \.offset) { _, status in
                    Circle()
                        .fill(Self.dotColor(for: status))
                        .frame(width: 4, height: 4)
                }
            }
        }
    }

    private static func dotColor(for status: WatchedPortStatus) -> Color {
        switch WatchedPortDotState(from: status) {
        case .free: return Color.primary.opacity(0.25)
        case .owned: return Palette.mutedGreen
        case .blocked: return Palette.mutedAmber
        case .conflict: return Palette.mutedRed
        }
    }
}

private struct PortsSettingsView: View {
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Section("Watched Ports") {
                TextField("Ports", text: self.$settings.watchedPortsText, prompt: Text("3000,5173,8081"))
                Text("Comma-separated list of ports to monitor. These ports are shown in the menu bar Dot Matrix and highlighted in the popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Port Suggestion") {
                TextField("Command template", text: self.$settings.portCommandTemplate, prompt: Text("PORT={port}"))
                Text("Copied to clipboard when using a suggested port. Use {port} as placeholder.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text("Example: PORT={port} npm run dev")
                    .font(.system(.footnote, design: .monospaced))
                    .foregroundStyle(.tertiary)
            }
        }
        .formStyle(.grouped)
    }
}

private struct AdvancedSettingsView: View {
    @ObservedObject var store: PortpourriStore

    var body: some View {
        Form {
            Section("Export") {
                Button("Copy latest snapshot JSON") {
                    self.store.copySnapshotJSON()
                }
                if let notice = self.store.clipboardNotice {
                    Text(notice)
                        .font(.footnote)
                        .foregroundStyle(.green)
                }
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

private struct AboutSettingsView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject var settings: SettingsStore

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev"
    }

    private var buildNumber: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "-"
    }

    private var buildTime: String {
        Bundle.main.object(forInfoDictionaryKey: "NWBuildTimestamp") as? String ?? "Unknown"
    }

    var body: some View {
        Form {
            Section {
                HStack(spacing: 16) {
                    Image(systemName: "network")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Portpourri")
                            .font(.title2.bold())
                        Text("v\(self.appVersion) (build \(self.buildNumber))")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Built \(self.buildTime)")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section("Links") {
                Link(destination: URL(string: "https://www.portpourri.com")!) {
                    HStack {
                        Image(systemName: "globe")
                            .frame(width: 20)
                        Text("Website")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri")!) {
                    HStack {
                        Image(systemName: "chevron.left.forwardslash.chevron.right")
                            .frame(width: 20)
                        Text("GitHub Repository")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri/issues")!) {
                    HStack {
                        Image(systemName: "exclamationmark.bubble")
                            .frame(width: 20)
                        Text("Issues & Feedback")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri/releases")!) {
                    HStack {
                        Image(systemName: "tag")
                            .frame(width: 20)
                        Text("Release Notes")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://x.com/jskoiz")!) {
                    HStack {
                        Image(systemName: "at")
                            .frame(width: 20)
                        Text("@jskoiz on X")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .formStyle(.grouped)
    }
}
