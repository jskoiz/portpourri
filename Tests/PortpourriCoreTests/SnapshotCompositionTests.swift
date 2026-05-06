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

    func testWatchedPortOwnerChangesMarkFreeToOwnedFromFixtureSnapshot() throws {
        let previous = AppSnapshot.empty(watchedPorts: [5173])
        let current = SnapshotService.sampleSnapshot(watchedPorts: [5173], fixtureName: "mixed")

        let annotated = current.markingWatchedPortOwnerChanges(from: previous)
        let status = try XCTUnwrap(annotated.watchedPorts.first(where: { $0.port == 5173 }))
        let change = try XCTUnwrap(status.ownerChange)

        XCTAssertEqual(change.previous.kind, .free)
        XCTAssertEqual(change.previous.summary, "Free")
        XCTAssertEqual(change.current.kind, .owned)
        XCTAssertEqual(change.current.summary, "vite (62620)")
        XCTAssertEqual(change.summary, "Free -> vite (62620)")
    }

    func testWatchedPortOwnerChangesMarkOwnedToBlockedFromFixtureSnapshot() throws {
        let fixture = SnapshotService.sampleSnapshot(watchedPorts: [5173], fixtureName: "mixed")
        let current = self.snapshotReplacingWatchedPort(
            in: fixture,
            with: WatchedPortStatus(
                port: 5173,
                isBusy: true,
                ownerSummary: "python3 (456)",
                isNodeOwned: false,
                isConflict: true
            )
        )

        let annotated = current.markingWatchedPortOwnerChanges(from: fixture)
        let change = try XCTUnwrap(annotated.watchedPorts.first?.ownerChange)

        XCTAssertEqual(change.previous.kind, .owned)
        XCTAssertEqual(change.previous.summary, "vite (62620)")
        XCTAssertEqual(change.current.kind, .blocked)
        XCTAssertEqual(change.current.summary, "python3 (456)")
    }

    func testWatchedPortOwnerChangesMarkOwnerReplacementFromFixtureSnapshot() throws {
        let current = SnapshotService.sampleSnapshot(watchedPorts: [5173], fixtureName: "mixed")
        let previous = self.snapshotReplacingWatchedPort(
            in: current,
            with: WatchedPortStatus(
                port: 5173,
                isBusy: true,
                ownerSummary: "next dev (999)",
                isNodeOwned: true,
                isConflict: false
            )
        )

        let annotated = current.markingWatchedPortOwnerChanges(from: previous)
        let change = try XCTUnwrap(annotated.watchedPorts.first?.ownerChange)

        XCTAssertEqual(change.previous.kind, .owned)
        XCTAssertEqual(change.previous.summary, "next dev (999)")
        XCTAssertEqual(change.current.kind, .owned)
        XCTAssertEqual(change.current.summary, "vite (62620)")
    }

    func testWatchedPortOwnerChangesIgnoreUnchangedOwnerFromFixtureSnapshot() throws {
        let current = SnapshotService.sampleSnapshot(watchedPorts: [5173], fixtureName: "mixed")
        let annotated = current.markingWatchedPortOwnerChanges(from: current)

        XCTAssertNil(annotated.watchedPorts.first?.ownerChange)
    }

    func testWatchedPortOwnerStateTreatsExplicitConflictsAsBlocked() {
        let status = WatchedPortStatus(
            port: 5173,
            isBusy: true,
            ownerSummary: "vite (62620), next dev (999)",
            isNodeOwned: true,
            isConflict: true
        )

        XCTAssertEqual(status.ownerState.kind, .blocked)
        XCTAssertEqual(status.ownerState.summary, "vite (62620), next dev (999)")
    }

    private func snapshotReplacingWatchedPort(in snapshot: AppSnapshot, with status: WatchedPortStatus) -> AppSnapshot {
        AppSnapshot(
            generatedAt: snapshot.generatedAt,
            summary: snapshot.summary,
            watchedPorts: snapshot.watchedPorts.map { $0.port == status.port ? status : $0 },
            projects: snapshot.projects,
            otherProcesses: snapshot.otherProcesses,
            nodeProcessGroups: snapshot.nodeProcessGroups,
            diagnostics: snapshot.diagnostics
        )
    }
}
