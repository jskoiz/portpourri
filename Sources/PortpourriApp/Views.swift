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
    @State private var showBackgroundNodeInventory = false
    @State private var showAITools = false

    var body: some View {
        let allWatchedPorts = self.store.snapshot.watchedPorts
            .sorted(by: DisplayText.compareWatchedPorts)
        let activeWatchedPorts = allWatchedPorts.filter(\.isBusy)
        let blockedWatchedPorts = activeWatchedPorts.filter { !$0.isNodeOwned }
        let visibleOtherProcesses = self.store.visibleOtherProcesses()
        let activeListenerGroups = self.store.activeListenerGroups
        let backgroundNodeGroups = BackgroundNodeInventory.groups(
            from: self.store.snapshot.nodeProcessGroups,
            subtracting: activeListenerGroups
        )
        let conflictCount = allWatchedPorts.filter(\.isConflict).count
        let projectCount = SnapshotDetails.sortedProjects(self.store.snapshot.projects).count
        let projects = SnapshotDetails.sortedProjects(self.store.snapshot.projects)
        let aiSnapshot = self.store.aiSnapshot
        let hasAITools = !aiSnapshot.claudeWorktrees.isEmpty || !aiSnapshot.codexWorktrees.isEmpty
        let isProjectMode = self.settings.groupMode == .project
        let currentIssue = self.store.currentIssue

        ZStack {
            PopoverMaterialBackground()

            VStack(alignment: .leading, spacing: LayoutMetrics.popoverSectionSpacing) {
                // 1. Header
                CompactHeader(
                    snapshot: self.store.snapshot,
                    useSampleData: self.store.useSampleData,
                    conflictCount: conflictCount,
                    projectCount: projectCount
                )

                if let currentIssue {
                    IssueCalloutView(issue: currentIssue)
                }

                // 2. Main content
                if isProjectMode {
                    if !blockedWatchedPorts.isEmpty {
                        WatchedPortsSection(
                            store: self.store,
                            watchedPorts: blockedWatchedPorts,
                            otherProcesses: visibleOtherProcesses
                        )
                    }

                    if !projects.isEmpty {
                        Divider()
                        ProjectDashboardSection(
                            store: self.store,
                            projects: projects
                        )
                    }
                } else if !activeWatchedPorts.isEmpty {
                    WatchedPortsSection(
                        store: self.store,
                        watchedPorts: activeWatchedPorts,
                        otherProcesses: visibleOtherProcesses
                    )
                }

                // 3. Other listeners / Blockers
                if self.settings.showNonNodeListeners, !visibleOtherProcesses.isEmpty {
                    Divider()
                    OtherListenersSection(processes: visibleOtherProcesses)
                }

                // 4. Process groups
                if !activeListenerGroups.isEmpty {
                    Divider()
                    NodeProcessDrawerToggle(
                        summary: self.store.snapshot.summary,
                        isOpen: self.$showProcessDrawer
                    )

                    if self.showProcessDrawer {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 2) {
                                ForEach(activeListenerGroups) { group in
                                    NodeProcessGroupRow(store: self.store, group: group)
                                }
                            }
                        }
                        .frame(maxHeight: LayoutMetrics.processDrawerMaxHeight)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }

                // 5. Background Node inventory
                if !backgroundNodeGroups.isEmpty {
                    Divider()
                    BackgroundNodeInventorySection(
                        groups: backgroundNodeGroups,
                        isExpanded: self.$showBackgroundNodeInventory
                    )
                }

                // 6. AI tools
                if hasAITools {
                    Divider()
                    AIToolsSection(aiSnapshot: aiSnapshot, isExpanded: self.$showAITools)
                }
            }
            .padding(.horizontal, LayoutMetrics.popoverHorizontalPadding)
            .padding(.vertical, LayoutMetrics.popoverVerticalPadding)
            .animation(.easeInOut(duration: 0.2), value: self.showProcessDrawer)
            .animation(.easeInOut(duration: 0.2), value: self.showBackgroundNodeInventory)
            .animation(.easeInOut(duration: 0.2), value: self.showAITools)
        }
        .frame(width: LayoutMetrics.popoverWidth)
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
                    .accessibilityHidden(true)
                    .onAppear {
                        Task { @MainActor in
                            try? await Task.sleep(for: .seconds(1.5))
                            self.store.clipboardNotice = nil
                        }
                    }
            }
        }
    }
}

private enum BackgroundNodeInventory {
    private static let minimumVisibleCount = 3

    static func groups(from inventory: [NodeProcessGroup], subtracting activeGroups: [ActiveListenerGroup]) -> [NodeProcessGroup] {
        let activeCounts = Dictionary(grouping: activeGroups, by: \.toolLabel)
            .mapValues { $0.reduce(0) { $0 + $1.count } }

        return inventory.compactMap { group in
            let remainingCount = group.count - (activeCounts[group.toolLabel] ?? 0)
            guard remainingCount >= minimumVisibleCount else { return nil }
            return NodeProcessGroup(
                toolLabel: group.toolLabel,
                count: remainingCount,
                totalMemoryBytes: scaledMemory(total: group.totalMemoryBytes, originalCount: group.count, remainingCount: remainingCount),
                pids: Array(group.pids.prefix(remainingCount))
            )
        }
        .sorted {
            if $0.totalMemoryBytes == $1.totalMemoryBytes {
                return $0.toolLabel.localizedCaseInsensitiveCompare($1.toolLabel) == .orderedAscending
            }
            return $0.totalMemoryBytes > $1.totalMemoryBytes
        }
    }

    private static func scaledMemory(total: Int, originalCount: Int, remainingCount: Int) -> Int {
        guard originalCount > 0 else { return total }
        let average = Double(total) / Double(originalCount)
        return Int((average * Double(remainingCount)).rounded())
    }
}
