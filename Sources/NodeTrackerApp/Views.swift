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

    @State private var showProcessDrawer = true

    var body: some View {
        let conflicts = self.store.snapshot.watchedPorts.filter(\.isConflict)
            .filter { !$0.ownerSummary.localizedCaseInsensitiveContains("ControlCenter") }
            .sorted(by: DisplayText.compareWatchedPorts)
        let nodeOwnedPorts = self.store.snapshot.watchedPorts
            .filter { $0.isBusy && $0.isNodeOwned && !$0.isConflict }
            .sorted(by: DisplayText.compareWatchedPorts)
        let allProjects = SnapshotDetails.sortedProjects(self.store.snapshot.projects)
        let visibleOtherProcesses = self.store.visibleOtherProcesses()
        let significantGroups = self.store.snapshot.nodeProcessGroups.filter { $0.count >= 3 }

        ZStack {
            PopoverMaterialBackground()

            VStack(alignment: .leading, spacing: 8) {
                CompactHeader(
                    snapshot: self.store.snapshot,
                    useSampleData: self.store.useSampleData,
                    conflictCount: conflicts.count,
                    projectCount: allProjects.count
                )

                if conflicts.isEmpty && allProjects.isEmpty && nodeOwnedPorts.isEmpty
                    && significantGroups.isEmpty {
                    IdleStateView()
                }

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

                if self.settings.showNonNodeListeners, !visibleOtherProcesses.isEmpty {
                    Divider()
                    OtherListenersSection(processes: visibleOtherProcesses)
                }

                // Bottom drawer toggle for node process groups
                if !significantGroups.isEmpty {
                    Divider()
                    NodeProcessDrawerToggle(
                        summary: self.store.snapshot.summary,
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

                Divider()
                AIToolsSection(store: self.store, aiTools: self.store.snapshot.aiTools)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .frame(width: 330)
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
                Text(DisplayText.watchedPortHeadline(self.status, blockers: self.blockers))
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)
                if let detail = DisplayText.blockerDetail(self.blockers) {
                    Text(detail)
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
        } else if self.projects.contains(where: { !$0.processes.isEmpty }),
                  let suggested = self.store.nextAvailablePort(after: self.status.port) {
            InlineAccentButton("Use \(suggested)", tone: .node) {
                self.store.copySuggestedPort(after: self.status.port)
            }
        }
    }

    private var primaryBlocker: TrackedProcessSnapshot? {
        self.blockers.min(by: { lhs, rhs in
            let lhsPriority = ResolutionAdvisor.displayPriority(for: lhs)
            let rhsPriority = ResolutionAdvisor.displayPriority(for: rhs)
            if lhsPriority != rhsPriority {
                return lhsPriority < rhsPriority
            }
            let lhsLabel = DisplayText.blockerName(lhs)
            let rhsLabel = DisplayText.blockerName(rhs)
            let labelComparison = lhsLabel.localizedCaseInsensitiveCompare(rhsLabel)
            if labelComparison != .orderedSame {
                return labelComparison == .orderedAscending
            }
            return lhs.process.pid < rhs.process.pid
        })
    }

    private var blockers: [TrackedProcessSnapshot] {
        let combined = self.otherProcesses + self.projects.flatMap(\.processes)
        var seen: Set<Int> = []
        return combined.filter { seen.insert($0.process.pid).inserted }
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
    @State private var isHovered = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) {
                    self.isExpanded.toggle()
                }
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Circle()
                        .fill(Palette.mutedGreen)
                        .frame(width: 6, height: 6)

                    Text(self.project.displayName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
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

                    Image(systemName: "chevron.right")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                        .rotationEffect(.degrees(self.isExpanded ? 90 : 0))
                        .animation(.easeInOut(duration: 0.15), value: self.isExpanded)
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
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: 5)
                .fill(self.isHovered ? Color.primary.opacity(0.04) : Color.clear)
        )
        .onHover { hovering in
            self.isHovered = hovering
        }
    }
}

// MARK: - Node Process Groups

private struct NodeProcessDrawerToggle: View {
    let summary: SnapshotSummary
    let significantGroupCount: Int
    @Binding var isOpen: Bool

    var body: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.15)) {
                self.isOpen.toggle()
            }
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
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
                    .rotationEffect(.degrees(self.isOpen ? 90 : 0))
                    .animation(.easeInOut(duration: 0.15), value: self.isOpen)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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
    @State private var isExpanded = false
    @State private var isHovered = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) {
                    self.isExpanded.toggle()
                }
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Text("\(self.group.count)\u{00D7}")
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(Readability.secondaryText)
                        .frame(width: 30, alignment: .trailing)

                    Text(self.group.toolLabel)
                        .font(.caption)
                        .fontWeight(.medium)
                        .lineLimit(1)

                    Spacer(minLength: 4)

                    Text(self.group.formattedMemory)
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(
                            self.group.totalMemoryBytes > 500 * 1024 * 1024
                                ? Palette.mutedRed
                                : Readability.secondaryText
                        )

                    Image(systemName: "chevron.right")
                        .font(.system(size: 9))
                        .foregroundStyle(Readability.secondaryText)
                        .rotationEffect(.degrees(self.isExpanded ? 90 : 0))
                        .animation(.easeInOut(duration: 0.15), value: self.isExpanded)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if self.isExpanded {
                HStack(spacing: 8) {
                    InlineAccentButton("Kill all", tone: .conflict) {
                        self.store.terminateGroup(self.group)
                    }

                    InlineTextButton("Copy PIDs") {
                        let pids = self.group.pids.map(String.init).joined(separator: ", ")
                        self.store.copyText(pids, label: "PIDs")
                    }
                }
                .padding(.top, 6)
                .padding(.leading, 34)
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 4)
                .fill(self.isHovered || self.isExpanded ? Color.primary.opacity(0.03) : Color.clear)
        )
        .onHover { hovering in
            self.isHovered = hovering
        }
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
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Image(systemName: "network")
                .font(.caption)
                .foregroundStyle(Readability.secondaryText)
            Text("NodeWatcher")
                .font(.subheadline)
                .fontWeight(.semibold)

            self.summaryLine
                .font(.caption)

            Spacer()
            Text(self.relativeUpdatedText)
                .font(.caption)
                .foregroundStyle(Readability.secondaryText)
        }
    }

    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    private var relativeUpdatedText: String {
        let elapsed = Date().timeIntervalSince(self.snapshot.generatedAt)
        guard elapsed > 3 else { return "Just now" }
        return Self.relativeDateFormatter.localizedString(fromTimeInterval: -elapsed)
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
            parts.append(
                Text("\(Image(systemName: "circle.fill"))").font(.system(size: 5)).foregroundColor(Palette.mutedGreen)
                + Text(" \(self.projectCount) running")
            )
        }
        let separator = Text(" \u{00B7} ").foregroundColor(Readability.secondaryText)
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


private struct IdleStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "moon.zzz")
                .font(.system(size: 24))
                .foregroundStyle(Color.primary.opacity(0.20))
            Text("No Node processes running")
                .font(.caption)
                .foregroundStyle(Readability.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
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
    static let secondaryText = Color(nsColor: .secondaryLabelColor)
}

private struct PortBadge: View {
    let port: Int
    let tone: AccentTone

    var body: some View {
        Text(verbatim: String(self.port))
            .font(.system(.caption, design: .monospaced))
            .fontWeight(.medium)
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
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
            .font(.system(size: 10, weight: .semibold))
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

// MARK: - AI Tools Section

private struct AIToolsSection: View {
    @ObservedObject var store: NodeTrackerStore
    let aiTools: AIToolSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if !self.aiTools.hasContent {
                HStack(spacing: 6) {
                    ProgressView()
                        .controlSize(.small)
                    Text("Scanning worktrees\u{2026}")
                        .font(.caption)
                        .foregroundStyle(Readability.secondaryText)
                }
                .padding(.vertical, 4)
            } else {
                if !self.aiTools.claudeWorktrees.isEmpty || self.aiTools.claudeSessionCount > 0 {
                    AIToolSourceRow(
                        store: self.store,
                        iconImage: BrandIcon.claude,
                        label: "Claude Code",
                        worktrees: self.aiTools.claudeWorktrees,
                        sessionCount: self.aiTools.claudeSessionCount,
                        totalSize: self.aiTools.claudeTotalSize
                    )
                }

                if !self.aiTools.codexWorktrees.isEmpty || self.aiTools.codexSessionCount > 0 {
                    AIToolSourceRow(
                        store: self.store,
                        iconImage: BrandIcon.codex,
                        label: "Codex",
                        worktrees: self.aiTools.codexWorktrees,
                        sessionCount: self.aiTools.codexSessionCount,
                        totalSize: self.aiTools.codexTotalSize
                    )
                }

                if self.aiTools.totalStaleCount > 0 {
                    HStack {
                        Text("\(self.aiTools.totalStaleCount) stale (3+ days)")
                            .font(.caption)
                            .foregroundStyle(Readability.secondaryText)
                        Spacer()
                        InlineAccentButton("Clear stale", tone: .conflict) {
                            self.store.deleteStaleWorktrees()
                        }
                    }
                    .padding(.top, 2)
                }
            }
        }
    }
}

private struct AIToolSourceRow: View {
    @ObservedObject var store: NodeTrackerStore
    let iconImage: NSImage?
    let label: String
    let worktrees: [AIWorktreeEntry]
    let sessionCount: Int
    let totalSize: Int64
    @State private var isExpanded = false
    @State private var isHovered = false

    private var formattedSize: String {
        let mb = Double(self.totalSize) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) {
                    self.isExpanded.toggle()
                }
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Group {
                        if let img = self.iconImage {
                            Image(nsImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 13, height: 13)
                        } else {
                            Image(systemName: "questionmark.circle")
                                .font(.caption)
                        }
                    }
                    .frame(width: 16)

                    Text(self.label)
                        .font(.caption)
                        .fontWeight(.semibold)

                    Text("\(self.worktrees.count) worktree\(self.worktrees.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(Readability.secondaryText)

                    if self.sessionCount > 0 {
                        Text("\u{00B7} \(self.sessionCount) sessions")
                            .font(.caption)
                            .foregroundStyle(Readability.secondaryText)
                    }

                    Spacer(minLength: 4)

                    Text(self.formattedSize)
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(
                            self.totalSize > 1024 * 1024 * 1024
                                ? Palette.mutedRed
                                : Readability.secondaryText
                        )

                    Image(systemName: "chevron.right")
                        .font(.system(size: 9))
                        .foregroundStyle(Readability.secondaryText)
                        .rotationEffect(.degrees(self.isExpanded ? 90 : 0))
                        .animation(.easeInOut(duration: 0.15), value: self.isExpanded)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                            ForEach(self.worktrees) { entry in
                                AIWorktreeRow(store: self.store, entry: entry)
                            }
                        }
                    }
                    .frame(maxHeight: 180)

                    if self.worktrees.count > 1 {
                        HStack {
                            Spacer()
                            InlineAccentButton("Clear all", tone: .conflict) {
                                self.store.deleteAllWorktrees(self.worktrees)
                            }
                        }
                        .padding(.top, 4)
                    }
                }
                .padding(.leading, 20)
                .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 5)
                .fill(self.isHovered ? Color.primary.opacity(0.04) : Color.clear)
        )
        .onHover { hovering in
            self.isHovered = hovering
        }
    }
}

private struct AIWorktreeRow: View {
    @ObservedObject var store: NodeTrackerStore
    let entry: AIWorktreeEntry
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) {
                    self.isExpanded.toggle()
                }
            } label: {
                HStack(alignment: .center, spacing: 6) {
                    Text(self.entry.name)
                        .font(.caption)
                        .foregroundStyle(self.entry.isStale ? Readability.secondaryText : .primary)
                        .lineLimit(1)
                        .truncationMode(.middle)

                    if let project = self.entry.projectName {
                        Text(project)
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                            .lineLimit(1)
                    }

                    if self.entry.daysSinceModified > 0 {
                        Text("\(self.entry.daysSinceModified)d")
                            .font(.caption2)
                            .foregroundStyle(self.entry.isStale ? Palette.mutedRed : Readability.secondaryText)
                    }

                    Spacer(minLength: 4)

                    Text(self.entry.formattedSize)
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(Readability.secondaryText)

                    Image(systemName: "chevron.right")
                        .font(.system(size: 7))
                        .foregroundStyle(Readability.secondaryText)
                        .rotationEffect(.degrees(self.isExpanded ? 90 : 0))
                        .animation(.easeInOut(duration: 0.15), value: self.isExpanded)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.vertical, 3)

            if self.isExpanded {
                HStack(spacing: 8) {
                    InlineTextButton("Reveal") {
                        self.store.revealWorktree(self.entry)
                    }
                    InlineAccentButton("Delete", tone: .conflict) {
                        self.store.deleteWorktree(self.entry)
                    }
                }
                .padding(.leading, 4)
                .padding(.bottom, 4)
            }
        }
    }
}

// MARK: - Brand Icons

@MainActor
private enum BrandIcon {
    static let claude: NSImage? = loadIcon("ProviderIcon-claude")
    static let codex: NSImage? = loadIcon("ProviderIcon-codex")

    private static func loadIcon(_ name: String) -> NSImage? {
        guard let url = Bundle.module.url(forResource: name, withExtension: "svg"),
              let image = NSImage(contentsOf: url) else {
            return nil
        }
        image.size = NSSize(width: 14, height: 14)
        image.isTemplate = true
        return image
    }
}

// MARK: - Visual Effects

private struct PopoverMaterialBackground: View {
    var body: some View {
        ZStack {
            VisualEffectView(material: .popover, blendingMode: .behindWindow, state: .active, isEmphasized: true)
            Color(nsColor: .windowBackgroundColor).opacity(0.3)
        }
        .ignoresSafeArea()
    }
}

private struct PopoverCapsuleBackground: View {
    var body: some View {
        VisualEffectView(material: .sidebar, blendingMode: .withinWindow, state: .active)
    }
}

private struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode
    let state: NSVisualEffectView.State
    var isEmphasized: Bool = false

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = self.material
        view.blendingMode = self.blendingMode
        view.state = self.state
        view.isEmphasized = self.isEmphasized
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = self.material
        nsView.blendingMode = self.blendingMode
        nsView.state = self.state
        nsView.isEmphasized = self.isEmphasized
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
    static func displayPriority(for process: TrackedProcessSnapshot) -> Int {
        let command = process.process.commandLine.lowercased()
        let tool = process.process.toolLabel.lowercased()
        let listenerIsSSH = process.listeners.contains {
            let name = $0.commandName.lowercased()
            return name == "ssh" || name == "sshd"
        }

        if tool == "ssh" || tool == "sshd" || command.hasPrefix("ssh ") || listenerIsSSH {
            return 0
        }

        if process.process.isNodeFamily {
            return 1
        }

        if self.applicationBundlePath(from: process.process.commandLine)?.localizedCaseInsensitiveContains("/Docker.app") == true {
            return 2
        }

        if process.process.commandLine.hasPrefix("/System/") {
            return 3
        }

        if ProcessActionPolicy.canTerminate(process) {
            return 4
        }

        return 5
    }

    static func primaryAction(for process: TrackedProcessSnapshot, portContext: Int?) -> ResolutionAction? {
        let command = process.process.commandLine
        let lowercasedCommand = command.lowercased()
        let tool = process.process.toolLabel.lowercased()

        if process.process.isNodeFamily, portContext != nil {
            return ResolutionAction(title: "Free port", tone: .node, kind: .terminate)
        }

        let listenerIsSSH = process.listeners.contains {
            $0.commandName.lowercased() == "ssh" || $0.commandName.lowercased() == "sshd"
        }
        if tool == "ssh" || tool == "sshd" || lowercasedCommand.hasPrefix("ssh ") || listenerIsSSH {
            return ResolutionAction(title: "Stop tunnel", tone: .conflict, kind: .terminate)
        }

        // Docker-owned ports (postgres, redis, etc.) are typically intentional
        // infrastructure — no action button, just informational display.
        if self.applicationBundlePath(from: command)?.localizedCaseInsensitiveContains("/Docker.app") == true {
            return nil
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

    static func watchedPortHeadline(_ status: WatchedPortStatus, blockers: [TrackedProcessSnapshot]) -> String {
        let owner = self.watchedPortOwner(status, blockers: blockers)
        if status.isConflict {
            return "Blocked by \(owner)"
        }
        if status.isNodeOwned {
            return "Used by \(owner)"
        }
        return "In use by \(owner)"
    }

    static func blockerDetail(_ blockers: [TrackedProcessSnapshot]) -> String? {
        guard !blockers.isEmpty else { return nil }
        if blockers.count == 1 {
            let process = blockers[0]
            let pid = "PID \(process.process.pid)"
            if let cwd = process.process.cwd, cwd != "/" {
                return "\(pid) \u{00B7} \(self.path(cwd))"
            }
            return pid
        }

        let summaries = blockers.map { "\(blockerName($0)) PID \($0.process.pid)" }
        return "2 blockers: " + summaries.joined(separator: ", ")
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

    static func blockerName(_ process: TrackedProcessSnapshot) -> String {
        let tool = process.process.toolLabel
        let command = process.process.commandLine.lowercased()

        if tool.caseInsensitiveCompare("com.docker.backend") == .orderedSame {
            return "Docker"
        }
        if tool.caseInsensitiveCompare("ControlCenter") == .orderedSame {
            return "Control Center"
        }
        if tool.caseInsensitiveCompare("ssh") == .orderedSame
            || tool.caseInsensitiveCompare("sshd") == .orderedSame
            || command.hasPrefix("ssh ") {
            return "SSH tunnel"
        }

        return tool
    }

    private static func watchedPortOwner(_ status: WatchedPortStatus, blockers: [TrackedProcessSnapshot]) -> String {
        let ownerNames = blockers.map(blockerName)
        if !ownerNames.isEmpty {
            return formatOwnerNames(ownerNames)
        }

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

    private static func formatOwnerNames(_ owners: [String]) -> String {
        let uniqueOwners = Array(NSOrderedSet(array: owners)) as? [String] ?? owners
        switch uniqueOwners.count {
        case 0:
            return "another process"
        case 1:
            return uniqueOwners[0]
        case 2:
            return "\(uniqueOwners[0]) and \(uniqueOwners[1])"
        default:
            return "\(uniqueOwners[0]), \(uniqueOwners[1]), and \(uniqueOwners.count - 2) more"
        }
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
    @State private var showPortOnboarding = false

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
            NotificationsSettingsView(settings: self.settings)
                .tabItem { Label("Notifications", systemImage: "bell") }
            AdvancedSettingsView(store: self.store)
                .tabItem { Label("Advanced", systemImage: "wrench") }
            AboutSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .padding(20)
        .frame(width: 560, height: 440)
        .onAppear {
            self.showPortOnboarding = !self.settings.hasCompletedPortOnboarding
        }
        .sheet(isPresented: self.$showPortOnboarding) {
            WatchedPortsOnboardingView(
                settings: self.settings,
                isPresented: self.$showPortOnboarding
            )
        }
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: NodeTrackerStore
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
                Text("Global shortcut to toggle the NodeWatcher popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Safety") {
                Toggle("Confirm before terminate", isOn: self.$settings.confirmBeforeTerminate)
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
    @State private var showPortOnboarding = false

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
                Toggle("Show conflict badge", isOn: self.$settings.showConflictBadge)
                Toggle("Hide icon when idle", isOn: self.$settings.hideWhenIdle)
                Text("Hides the menu bar icon when no Node processes are running.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Popover") {
                Picker("Group content by", selection: self.$settings.groupMode) {
                    ForEach(GroupMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                Toggle("Show non-Node listeners", isOn: self.$settings.showNonNodeListeners)
            }

            Section("Watched Ports") {
                Button("Choose common ports…") {
                    self.showPortOnboarding = true
                }
                TextField("Ports", text: self.$settings.watchedPortsText, prompt: Text("3000,5173,8081"))
                Text("Pick presets for common local ports, then use the comma-separated field for anything custom.")
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
        .sheet(isPresented: self.$showPortOnboarding) {
            WatchedPortsOnboardingView(
                settings: self.settings,
                isPresented: self.$showPortOnboarding
            )
        }
    }
}

private struct WatchedPortsOnboardingView: View {
    @ObservedObject var settings: SettingsStore
    @Binding var isPresented: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Choose watched ports")
                .font(.title3)
                .fontWeight(.semibold)

            Text("NodeWatcher only flags the ports you care about. Start with the common presets below, then add anything custom in Display settings.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 12) {
                ForEach(SettingsStore.watchedPortPresets) { preset in
                    Toggle(isOn: self.binding(for: preset)) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(preset.title)
                                    .fontWeight(.medium)
                                if preset.isRecommended {
                                    StatusTag(text: "recommended", tone: .node)
                                }
                            }
                            Text("\(preset.detail) · \(preset.ports.map(String.init).joined(separator: ", "))")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .toggleStyle(.checkbox)
                }
            }

            Text(self.selectionSummary)
                .font(.footnote)
                .foregroundStyle(.secondary)

            HStack {
                Spacer()
                Button("Not now") {
                    self.isPresented = false
                }
                Button("Save") {
                    self.settings.completePortOnboarding()
                    self.isPresented = false
                }
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(24)
        .frame(width: 460)
    }

    private var selectionSummary: String {
        let ports = self.settings.watchedPorts
        if ports.isEmpty {
            return "No watched ports selected."
        }
        return "Watching \(ports.map(String.init).joined(separator: ", "))"
    }

    private func binding(for preset: WatchedPortPreset) -> Binding<Bool> {
        Binding(
            get: { self.settings.includesPreset(preset) },
            set: { self.settings.setPreset(preset, enabled: $0) }
        )
    }
}

private struct NotificationsSettingsView: View {
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Section("Port Conflicts") {
                Toggle("Notify on port conflicts", isOn: self.$settings.enableConflictNotifications)
                Toggle("Play notification sound", isOn: self.$settings.notificationSound)
                    .disabled(!self.settings.enableConflictNotifications)
            }
            Text("Notifications appear when a non-Node process occupies a watched port.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
    }
}

private struct AdvancedSettingsView: View {
    @ObservedObject var store: NodeTrackerStore

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
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject var settings: SettingsStore
    @State private var updateStatus: String?

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
                        Text("NodeWatcher")
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

            Section("Updates") {
                Toggle("Check for updates automatically", isOn: self.$settings.checkForUpdatesAutomatically)
                HStack {
                    Button("Check for Updates Now") {
                        self.updateStatus = "You\u{2019}re on the latest version."
                    }
                    if let status = self.updateStatus {
                        Text(status)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section("Links") {
                Link(destination: URL(string: "https://github.com/nicktoonz/node-tracker")!) {
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
                Link(destination: URL(string: "https://x.com/nicktoonz")!) {
                    HStack {
                        Image(systemName: "at")
                            .frame(width: 20)
                        Text("Follow on X (Twitter)")
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
