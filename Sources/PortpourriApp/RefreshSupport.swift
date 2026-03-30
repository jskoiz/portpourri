import Foundation
import PortpourriCore

actor SnapshotRefreshCoordinator {
    private var latestRequestedGeneration = 0

    func beginRefresh() -> Int {
        self.latestRequestedGeneration += 1
        return self.latestRequestedGeneration
    }

    func shouldApplyResult(for generation: Int) -> Bool {
        generation == self.latestRequestedGeneration
    }
}

struct ConflictNotificationState: Hashable {
    let port: Int
    let ownerSummary: String
}

struct ConflictNotificationTracker {
    private var previousStates: Set<ConflictNotificationState> = []

    mutating func newExternalConflicts(in watchedPorts: [WatchedPortStatus]) -> [ConflictNotificationState] {
        let currentStates = Set(
            watchedPorts
                .filter { $0.isConflict && !$0.isNodeOwned }
                .map { ConflictNotificationState(port: $0.port, ownerSummary: $0.ownerSummary) }
        )

        let newlyIntroduced = currentStates.subtracting(self.previousStates).sorted {
            if $0.port == $1.port {
                return $0.ownerSummary.localizedCaseInsensitiveCompare($1.ownerSummary) == .orderedAscending
            }
            return $0.port < $1.port
        }

        self.previousStates = currentStates
        return newlyIntroduced
    }
}
