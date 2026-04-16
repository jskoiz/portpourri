import Foundation
import XCTest
@testable import PortpourriApp

final class LaunchAtLoginManagerTests: XCTestCase {
    func testAvailabilityRejectsNonAppBundle() {
        let availability = LaunchAtLoginManager.availability(
            bundleURL: URL(fileURLWithPath: "/tmp/Portpourri"),
            teamIdentifier: "TEAMID"
        )

        XCTAssertEqual(availability, .unsupported(.unavailableOutsideAppBundle))
    }

    func testAvailabilityRejectsAppOutsideApplications() {
        let availability = LaunchAtLoginManager.availability(
            bundleURL: URL(fileURLWithPath: "/tmp/Portpourri.app"),
            teamIdentifier: "TEAMID"
        )

        XCTAssertEqual(availability, .unsupported(.requiresApplicationsInstall))
    }

    func testAvailabilityRejectsUnsignedApplicationsBundle() {
        let availability = LaunchAtLoginManager.availability(
            bundleURL: URL(fileURLWithPath: "/Applications/Portpourri.app"),
            teamIdentifier: nil
        )

        XCTAssertEqual(availability, .unsupported(.requiresSignedBundle))
    }

    func testAvailabilityAcceptsSignedApplicationsBundle() {
        let availability = LaunchAtLoginManager.availability(
            bundleURL: URL(fileURLWithPath: "/Applications/Portpourri.app"),
            teamIdentifier: "TEAMID"
        )

        XCTAssertEqual(availability, .supported)
    }
}
