import XCTest
@testable import PortpourriCore

final class SnapshotCompositionTests: XCTestCase {
    func testAppSnapshotComposesOwnershipAndInventory() {
        let ownership = PortOwnershipSnapshot(
            generatedAt: Date(timeIntervalSince1970: 123),
            watchedPorts: [
                WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "node (1)", isNodeOwned: true, isConflict: false),
                WatchedPortStatus(port: 5432, isBusy: true, ownerSummary: "postgres (2)", isNodeOwned: false, isConflict: true),
            ],
            projects: [
                ProjectSnapshot(
                    projectRoot: "/tmp/app",
                    displayName: "app",
                    processes: [],
                    ports: [3000],
                    isWorktreeLike: false
                ),
            ],
            otherProcesses: [
                TrackedProcessSnapshot(
                    process: ProcessSnapshot(
                        pid: 2,
                        ppid: 1,
                        state: "S",
                        uptime: "00:01",
                        commandLine: "postgres",
                        parentCommandLine: nil,
                        cwd: "/tmp",
                        isNodeFamily: false,
                        toolLabel: "postgres"
                    ),
                    listeners: [],
                    ports: [5432],
                    isWatchedConflict: true
                ),
            ],
            diagnostics: ProbeDiagnostics(commands: ["lsof"], source: "test")
        )

        let inventory = ProcessInventorySnapshot(
            generatedAt: Date(timeIntervalSince1970: 124),
            nodeProcessGroups: [
                NodeProcessGroup(toolLabel: "node", count: 3, totalMemoryBytes: 3_000, pids: [1, 2, 3]),
                NodeProcessGroup(toolLabel: "vite", count: 2, totalMemoryBytes: 2_000, pids: [4, 5]),
            ]
        )

        let snapshot = AppSnapshot(ownership: ownership, inventory: inventory)

        XCTAssertEqual(snapshot.generatedAt, ownership.generatedAt)
        XCTAssertEqual(snapshot.summary.nodeProjectCount, 1)
        XCTAssertEqual(snapshot.summary.watchedBusyCount, 2)
        XCTAssertEqual(snapshot.summary.otherListenerCount, 1)
        XCTAssertEqual(snapshot.summary.watchedNonNodeConflictCount, 1)
        XCTAssertEqual(snapshot.summary.nodeProcessTotalCount, 5)
        XCTAssertEqual(snapshot.summary.nodeProcessTotalMemoryBytes, 5_000)
        XCTAssertEqual(snapshot.nodeProcessGroups.count, 2)
        XCTAssertEqual(snapshot.diagnostics.source, "test")
    }
}
