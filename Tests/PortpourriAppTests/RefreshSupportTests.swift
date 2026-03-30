import XCTest
@testable import PortpourriApp
@testable import PortpourriCore

final class RefreshSupportTests: XCTestCase {
    func testRefreshCoordinatorRejectsStaleGeneration() async {
        let coordinator = SnapshotRefreshCoordinator()

        let first = await coordinator.beginRefresh()
        let second = await coordinator.beginRefresh()

        let firstApplies = await coordinator.shouldApplyResult(for: first)
        let secondApplies = await coordinator.shouldApplyResult(for: second)

        XCTAssertFalse(firstApplies)
        XCTAssertTrue(secondApplies)
    }

    func testConflictNotificationTrackerOnlyEmitsNewExternalConflictStates() {
        var tracker = ConflictNotificationTracker()

        let first = tracker.newExternalConflicts(in: [
            WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "postgres (2)", isNodeOwned: false, isConflict: true),
            WatchedPortStatus(port: 5173, isBusy: true, ownerSummary: "vite (10)", isNodeOwned: true, isConflict: false),
        ])
        XCTAssertEqual(first, [ConflictNotificationState(port: 3000, ownerSummary: "postgres (2)")])

        let repeated = tracker.newExternalConflicts(in: [
            WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "postgres (2)", isNodeOwned: false, isConflict: true),
            WatchedPortStatus(port: 5173, isBusy: true, ownerSummary: "vite (10)", isNodeOwned: true, isConflict: false),
        ])
        XCTAssertTrue(repeated.isEmpty)

        let changedOwner = tracker.newExternalConflicts(in: [
            WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "docker (9)", isNodeOwned: false, isConflict: true),
        ])
        XCTAssertEqual(changedOwner, [ConflictNotificationState(port: 3000, ownerSummary: "docker (9)")])

        let cleared = tracker.newExternalConflicts(in: [
            WatchedPortStatus(port: 3000, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false),
        ])
        XCTAssertTrue(cleared.isEmpty)
    }
}
