import SwiftUI
import PortpourriCore

struct ActiveNodeSummary {
    let totalCount: Int
    let totalMemoryBytes: Int
    let estimatedMemoryByGroupID: [String: Int]

    func estimatedMemory(for group: ActiveListenerGroup) -> Int {
        self.estimatedMemoryByGroupID[group.id] ?? 0
    }
}

enum ActiveNodeInventory {
    static func summarize(activeGroups: [ActiveListenerGroup], inventory: [NodeProcessGroup]) -> ActiveNodeSummary {
        let inventoryByTool = Dictionary(uniqueKeysWithValues: inventory.map { ($0.toolLabel, $0) })
        var estimatedMemoryByGroupID: [String: Int] = [:]

        for group in activeGroups {
            guard let inventoryGroup = inventoryByTool[group.toolLabel], inventoryGroup.count > 0 else {
                estimatedMemoryByGroupID[group.id] = 0
                continue
            }

            let averageBytes = Double(inventoryGroup.totalMemoryBytes) / Double(inventoryGroup.count)
            estimatedMemoryByGroupID[group.id] = Int((averageBytes * Double(group.count)).rounded())
        }

        return ActiveNodeSummary(
            totalCount: activeGroups.reduce(0) { $0 + $1.count },
            totalMemoryBytes: estimatedMemoryByGroupID.values.reduce(0, +),
            estimatedMemoryByGroupID: estimatedMemoryByGroupID
        )
    }
}

// MARK: - Node Process Groups

struct NodeProcessDrawerToggle: View {
    private let title = "Active Node"
    let totalCount: Int
    let totalMemoryBytes: Int
    @Binding var isOpen: Bool

    var body: some View {
        Button {
            self.isOpen.toggle()
        } label: {
            HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                Text(self.title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(Readability.secondaryText)
                Text("\(self.totalCount)")
                    .font(.caption)
                    .foregroundStyle(Readability.secondaryText)
                Text("\u{00B7}")
                    .foregroundStyle(Readability.secondaryText)
                Text(self.formattedTotalMemory)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(
                        self.totalMemoryBytes > 2 * 1024 * 1024 * 1024
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
        .accessibilityLabel("\(self.title), \(self.totalCount), \(self.formattedTotalMemory)")
        .accessibilityHint(self.isOpen ? "Collapse the active listener groups." : "Expand the active listener groups.")
    }

    private var formattedTotalMemory: String {
        let mb = Double(self.totalMemoryBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }
}

struct NodeProcessGroupRow: View {
    @ObservedObject var store: PortpourriStore
    let group: ActiveListenerGroup
    let estimatedMemoryBytes: Int

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                Button {
                    self.isExpanded.toggle()
                } label: {
                    HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                        Text("x\(self.group.count)")
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(Readability.secondaryText)
                            .frame(width: LayoutMetrics.countColumnWidth, alignment: .trailing)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(self.group.toolLabel)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)

                            HStack(spacing: 4) {
                                Text(self.groupDetail)
                                    .font(.caption2)
                                    .foregroundStyle(Readability.secondaryText)
                                    .lineLimit(1)
                                if self.group.isWorktreeLike {
                                    StatusTag(text: "worktree", tone: .neutral)
                                }
                            }
                        }

                        Spacer(minLength: 4)

                        Text(NodeProcessGroup(toolLabel: "", count: 0, totalMemoryBytes: self.estimatedMemoryBytes, pids: []).formattedMemory)
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(Readability.secondaryText)

                        Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

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

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(self.group.processes, id: \.id) { process in
                        HStack(spacing: 8) {
                            Text("PID \(process.process.pid)")
                                .font(.caption2)
                                .foregroundStyle(Readability.secondaryText)
                            if !process.ports.isEmpty {
                                Text(self.portSummary(for: process))
                                    .font(.caption2)
                                    .foregroundStyle(Readability.secondaryText)
                            }
                            Spacer()
                        }
                    }
                }
                .padding(.leading, LayoutMetrics.countColumnWidth + LayoutMetrics.cardRowSpacing)
            }
        }
        .accessibilityElement(children: .contain)
    }

    private var groupDetail: String {
        let ports = Set(self.group.processes.flatMap(\.ports)).sorted()
        guard !ports.isEmpty else { return self.group.displayName }
        let portLabel = ports.count == 1 ? "port \(ports[0])" : "ports " + ports.map(String.init).joined(separator: ", ")
        return "\(self.group.displayName) \u{00B7} \(portLabel)"
    }

    private func portSummary(for process: TrackedProcessSnapshot) -> String {
        let ports = process.ports.sorted()
        guard !ports.isEmpty else { return "listener" }
        if ports.count == 1 {
            return "port \(ports[0])"
        }
        return "ports " + ports.map(String.init).joined(separator: ", ")
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

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button {
                self.isExpanded.toggle()
            } label: {
                HStack(alignment: .center, spacing: LayoutMetrics.cardRowSpacing) {
                    Text("x\(self.group.count)")
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

                    Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .foregroundStyle(Readability.secondaryText)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(self.group.pids, id: \.self) { pid in
                        Text("PID \(pid)")
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                    }
                }
                .padding(.leading, LayoutMetrics.countColumnWidth + LayoutMetrics.cardRowSpacing)
            }
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
