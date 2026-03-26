import XCTest
@testable import NodeTrackerCore

final class ParsingTests: XCTestCase {
    func testLsofParserDetectsLoopbackAndWildcardListeners() throws {
        let raw = """
        p100
        cnode
        f10
        tIPv4
        n127.0.0.1:3000
        f11
        tIPv6
        n*:3000
        """

        let parser = LsofListenerParser()
        let listeners = parser.parse(raw)

        XCTAssertEqual(listeners.count, 2)
        XCTAssertEqual(listeners[0].hostScope, .loopback)
        XCTAssertEqual(listeners[1].hostScope, .any)
    }

    func testSampleSnapshotCollapsesDuplicateIPv4IPv6Listener() {
        let snapshot = SnapshotService.sampleSnapshot(watchedPorts: [3000, 5173, 5433, 8081])
        let backend = snapshot.projects.first { $0.displayName == "@acme/backend" }

        XCTAssertEqual(backend?.ports, [3000])
        XCTAssertEqual(snapshot.summary.nodeProjectCount, 3)
        XCTAssertEqual(snapshot.watchedPorts.first(where: { $0.port == 5433 })?.isConflict, true)
    }

    func testProcessClassifierLabelsCommonNodeTools() {
        let classifier = NodeProcessClassifier()

        let vite = classifier.classify(
            pid: 1,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "node /tmp/app/node_modules/.bin/vite --host 127.0.0.1",
            parentCommandLine: "npm exec vite",
            cwd: "/tmp/app"
        )

        let storybook = classifier.classify(
            pid: 2,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "node /tmp/app/node_modules/.bin/storybook dev -p 6006",
            parentCommandLine: "npm exec storybook",
            cwd: "/tmp/app"
        )

        XCTAssertTrue(vite.isNodeFamily)
        XCTAssertEqual(vite.toolLabel, "vite")
        XCTAssertEqual(storybook.toolLabel, "storybook")
    }

    func testPSParserCapturesCommandLines() {
        let raw = """
        61619 61601 02:15:13 SN   node --enable-source-maps /Users/example/acme/backend/dist/src/main
        61601 61590 02:15:22 S    node /Users/example/acme/backend/node_modules/.bin/nest start --watch
        """

        let parser = PSProcessParser()
        let records = parser.parse(raw)

        XCTAssertEqual(records[61619]?.ppid, 61601)
        XCTAssertEqual(records[61601]?.commandLine, "node /Users/example/acme/backend/node_modules/.bin/nest start --watch")
    }

    func testProcessClassifierRejectsFalsePositiveNodeSubstrings() {
        let classifier = NodeProcessClassifier()

        let discord = classifier.classify(
            pid: 1,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "/Applications/Discord.app/Contents/MacOS/Discord Helper --enable-node-leakage-in-renderers",
            parentCommandLine: "/Applications/Discord.app/Contents/MacOS/Discord",
            cwd: "/"
        )

        let simulatorRunner = classifier.classify(
            pid: 2,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "/Users/me/Library/Developer/CoreSimulator/Devices/AAA/data/Containers/Bundle/Application/BBB/Runner.app/Runner",
            parentCommandLine: "launchd_sim /tmp/bootstrap.plist",
            cwd: "/"
        )

        XCTAssertFalse(discord.isNodeFamily)
        XCTAssertFalse(simulatorRunner.isNodeFamily)
    }
}
