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
