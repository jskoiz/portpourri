import SwiftUI
import PortpourriCore

// MARK: - Zone 1: Watched Ports

struct WatchedPortsSection: View {
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
        HStack(spacing: LayoutMetrics.cardRowSpacing) {
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
            .accessibilityElement(children: .combine)

            Spacer(minLength: 4)

            self.actionButton
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color.primary.opacity(0.04), in: RoundedRectangle(cornerRadius: LayoutMetrics.cardCornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: LayoutMetrics.cardCornerRadius)
                .stroke(self.borderColor.opacity(0.30), lineWidth: LayoutMetrics.cardBorderWidth)
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("watched-port-\(self.status.port)")
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
                InlineAccentButton(
                    resolution.title,
                    tone: resolution.tone,
                    accessibilityLabel: "\(resolution.title) for port \(self.status.port)",
                    accessibilityHint: "Acts on the process currently associated with port \(self.status.port)."
                ) {
                    self.store.terminate(process: process, portContext: self.status.port)
                }
            case let .openApplication(path):
                InlineAccentButton(
                    resolution.title,
                    tone: resolution.tone,
                    accessibilityLabel: "\(resolution.title) for port \(self.status.port)",
                    accessibilityHint: "Opens the application currently associated with port \(self.status.port)."
                ) {
                    self.store.openApplication(at: path)
                }
            }
        } else if self.status.isConflict, let suggested = self.store.nextAvailablePort(after: self.status.port) {
            InlineAccentButton(
                "Use \(suggested)",
                tone: .node,
                accessibilityLabel: "Copy suggested port \(suggested)",
                accessibilityHint: "Copies a fallback command that replaces port \(self.status.port) with \(suggested)."
            ) {
                self.store.copySuggestedPort(after: self.status.port)
            }
        }
    }

    private var primaryBlocker: TrackedProcessSnapshot? {
        self.otherProcesses.first ?? self.projects.flatMap(\.processes).first
    }
}

// MARK: - Zone 2: Project Dashboard

struct ProjectDashboardSection: View {
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
                HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                    Circle()
                        .fill(Palette.mutedGreen)
                        .frame(width: LayoutMetrics.statusDotSize, height: LayoutMetrics.statusDotSize)

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
            .accessibilityLabel("\(self.project.displayName), \(DisplayText.toolsSummary(self.project.processes)), ports \(self.project.ports.map(String.init).joined(separator: ", "))")
            .accessibilityHint(self.isExpanded ? "Collapse process details." : "Expand process details.")

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
                        .frame(width: LayoutMetrics.sidebarRuleWidth)
                }
            }
        }
    }
}

// MARK: - Process Detail

private struct ProcessDetailRow: View {
    @ObservedObject var store: PortpourriStore
    let process: TrackedProcessSnapshot
    let portContext: Int?

    @State private var showDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button {
                self.showDetails.toggle()
            } label: {
                HStack(alignment: .firstTextBaseline) {
                    Text(self.process.process.toolLabel)
                        .font(.caption)
                        .fontWeight(.medium)

                    Spacer(minLength: 8)
                    Image(systemName: "ellipsis")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(self.process.process.toolLabel), PID \(self.process.process.pid)")
            .accessibilityHint(self.showDetails ? "Collapse process actions." : "Expand process actions.")

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
                        if let resolution = self.primaryResolution {
                            InlineAccentButton(
                                resolution.title,
                                tone: resolution.tone,
                                accessibilityLabel: "\(resolution.title) for PID \(self.process.process.pid)",
                                accessibilityHint: "Runs the primary action for this process."
                            ) {
                                self.run(resolution)
                            }
                        }
                        if ProcessActionPolicy.hasMeaningfulDirectory(self.process) {
                            InlineTextButton(
                                "Reveal",
                                accessibilityLabel: "Reveal process folder for PID \(self.process.process.pid)",
                                accessibilityHint: "Shows the working directory in Finder."
                            ) {
                                self.store.reveal(path: self.process.process.cwd)
                            }
                            if self.process.process.isNodeFamily {
                                InlineTextButton(
                                    "Terminal",
                                    accessibilityLabel: "Open Terminal at the process folder for PID \(self.process.process.pid)",
                                    accessibilityHint: "Opens a Terminal window in this process directory."
                                ) {
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
