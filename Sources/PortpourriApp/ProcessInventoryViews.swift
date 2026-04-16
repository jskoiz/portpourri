import SwiftUI
import PortpourriCore

// MARK: - Node Process Groups

struct NodeProcessDrawerToggle: View {
    let summary: SnapshotSummary
    @Binding var isOpen: Bool

    var body: some View {
        Button {
            self.isOpen.toggle()
        } label: {
            HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
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
                Image(systemName: self.isOpen ? "chevron.up" : "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Node processes, \(self.summary.nodeProcessTotalCount), \(self.formattedTotalMemory)")
        .accessibilityHint(self.isOpen ? "Collapse the active listener groups." : "Expand the active listener groups.")
    }

    private var formattedTotalMemory: String {
        let mb = Double(self.summary.nodeProcessTotalMemoryBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }
}

struct NodeProcessGroupRow: View {
    @ObservedObject var store: PortpourriStore
    let group: ActiveListenerGroup

    var body: some View {
        HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
            Text("\(self.group.count)\u{00D7}")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)
                .frame(width: LayoutMetrics.countColumnWidth, alignment: .trailing)

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

            InlineAccentButton(
                "Kill group",
                tone: .conflict,
                accessibilityLabel: "Kill group \(self.group.toolLabel) in \(self.group.displayName)",
                accessibilityHint: "Sends SIGTERM to the listener-backed Node processes in this project."
            ) {
                self.store.terminateGroup(self.group)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .contain)
    }

    private var groupPortSummary: String {
        let ports = Set(self.group.processes.flatMap(\.ports)).sorted()
        guard !ports.isEmpty else { return "listeners" }
        return ports.map(String.init).joined(separator: ",")
    }
}

struct BackgroundNodeInventorySection: View {
    let groups: [NodeProcessGroup]
    @Binding var isExpanded: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button {
                self.isExpanded.toggle()
            } label: {
                HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                    Text("Background Node")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(Readability.secondaryText)
                    Text("\(self.totalProcessCount)")
                        .font(.caption)
                        .foregroundStyle(Readability.secondaryText)
                    Text("\u{00B7}")
                        .foregroundStyle(Readability.secondaryText)
                    Text(self.totalMemory)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(Readability.secondaryText)
                    Spacer()
                    Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Background Node, \(self.totalProcessCount), \(self.totalMemory)")
            .accessibilityHint(self.isExpanded ? "Collapse the background Node inventory." : "Expand the background Node inventory.")

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(self.groups) { group in
                        BackgroundNodeGroupRow(group: group)
                    }
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }

    private var totalProcessCount: Int {
        self.groups.reduce(0) { $0 + $1.count }
    }

    private var totalMemory: String {
        let totalBytes = self.groups.reduce(0) { $0 + $1.totalMemoryBytes }
        return NodeProcessGroup(toolLabel: "", count: 0, totalMemoryBytes: totalBytes, pids: []).formattedMemory
    }
}

private struct BackgroundNodeGroupRow: View {
    let group: NodeProcessGroup

    var body: some View {
        HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
            Text("\(self.group.count)\u{00D7}")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)
                .frame(width: LayoutMetrics.countColumnWidth, alignment: .trailing)

            Text(self.group.toolLabel)
                .font(.caption)
                .fontWeight(.medium)
                .lineLimit(1)

            Spacer(minLength: 4)

            Text(self.group.formattedMemory)
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Readability.secondaryText)
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Other Listeners

struct OtherListenersSection: View {
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
        .accessibilityElement(children: .combine)
    }
}
