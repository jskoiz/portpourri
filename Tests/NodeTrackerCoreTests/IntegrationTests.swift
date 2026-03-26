import Foundation
import XCTest
@testable import NodeTrackerCore

final class IntegrationTests: XCTestCase {
    func testLiveSnapshotFindsNodeListenerAndProcessCanBeTerminated() throws {
        guard FileManager.default.isExecutableFile(atPath: "/opt/homebrew/bin/node") ||
                FileManager.default.isExecutableFile(atPath: "/usr/local/bin/node") ||
                ProcessInfo.processInfo.environment["PATH"]?.contains("node") == true
        else {
            throw XCTSkip("Node is not available in PATH.")
        }

        let port = 39123
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = [
            "node",
            "-e",
            """
            const net = require('net');
            const server = net.createServer(() => {});
            server.listen(\(port), '127.0.0.1');
            setInterval(() => {}, 1000);
            """,
        ]

        try process.run()
        defer {
            if process.isRunning {
                process.terminate()
            }
        }

        Thread.sleep(forTimeInterval: 1.0)

        let snapshot = try SnapshotService().captureLiveSnapshot(watchedPorts: [port])
        XCTAssertEqual(snapshot.watchedPorts.first?.port, port)
        XCTAssertEqual(snapshot.watchedPorts.first?.isBusy, true)
        XCTAssertTrue(snapshot.projects.contains { $0.ports.contains(port) })

        XCTAssertEqual(kill(process.processIdentifier, SIGTERM), 0)
        process.waitUntilExit()
        XCTAssertNotEqual(process.terminationStatus, 0)
    }
}
