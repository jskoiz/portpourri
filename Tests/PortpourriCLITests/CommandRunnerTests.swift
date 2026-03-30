import Foundation
import XCTest
@testable import PortpourriCLI
@testable import PortpourriCore

final class CommandRunnerTests: XCTestCase {
    func testSnapshotJSONUsesSchemaEnvelope() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["snapshot", "--json"])
        let data = try self.requireData(response)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let envelope = try decoder.decode(SnapshotExportEnvelope.self, from: data)

        XCTAssertEqual(envelope.schemaVersion, SnapshotExportEnvelope.currentSchemaVersion)
        XCTAssertEqual(envelope.snapshot.projects.map(\.displayName), ["@acme/backend", "@acme/mobile", "@acme/web"])
        XCTAssertEqual(envelope.snapshot.watchedPorts.first(where: { $0.port == 5433 })?.ownerSummary, "python3 (64640)")
    }

    func testSnapshotExportMatchesGoldenFixture() throws {
        let snapshot = self.makeFixedSnapshot()
        let data = try SnapshotService().exportJSON(snapshot: snapshot)
        let actualObject = try JSONSerialization.jsonObject(with: data) as? NSDictionary

        let fixtureURL = try XCTUnwrap(Bundle.module.url(forResource: "expected-snapshot-envelope", withExtension: "json"))
        let fixtureData = try Data(contentsOf: fixtureURL)
        let expectedObject = try JSONSerialization.jsonObject(with: fixtureData) as? NSDictionary

        XCTAssertEqual(actualObject, expectedObject)
    }

    func testWhyForWatchedFreePort() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["why", "3001"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            Port 3001
            Status: watched, free
            """
        )
    }

    func testWhyForWatchedNodeOwnedPort() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["why", "3000"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            Port 3000
            Status: watched, owned by your project
            Owner: nest (61619)
            Project: @acme/backend
            Root: /Users/example/acme/backend
            """
        )
    }

    func testWhyForWatchedBlockedPort() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["why", "5433"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            Port 5433
            Status: watched, blocked
            Owner: python3 (64640)
            Tool: python3
            PID: 64640
            Command: python3 -m http.server 5433
            """
        )
    }

    func testWhyForUnwatchedBusyPort() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeUnwatchedBusyEnvironment())
        let response = try runner.run(arguments: ["why", "4040"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            Port 4040
            Status: not watched, busy
            Owner: python3 (7000)
            Command: python3 -m http.server 4040
            """
        )
    }

    func testListWatchedUsesDeterministicFixtureOutput() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["list", "--watched"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            3000  owned by @acme/backend
            3001  free
            5000  free
            5173  owned by @acme/web
            5432  free
            5433  blocked by python3 (64640)
            6006  free
            6379  free
            8080  free
            8081  owned by @acme/mobile
            9229  free
            """
        )
    }

    func testListAllUsesDeterministicFixtureOutput() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["list", "--all"])

        XCTAssertEqual(
            try self.requireText(response),
            """
            Projects:
            @acme/backend
              3000  nest  pid 61619
            @acme/mobile
              8081  expo start  pid 63630
            @acme/web
              5173  vite  pid 62620

            Other listeners:
              5433  python3  pid 64640
            """
        )
    }

    func testDoctorIncludesHeadingsAndProbeCommands() throws {
        let runner = PortpourriCLICommandRunner(environment: self.makeFixtureEnvironment())
        let response = try runner.run(arguments: ["doctor"])
        let text = try self.requireText(response)

        XCTAssertTrue(text.contains("Portpourri doctor"))
        XCTAssertTrue(text.contains("Source: live"))
        XCTAssertTrue(text.contains("Listener probe: ok"))
        XCTAssertTrue(text.contains("Metadata enrichment: ok"))
        XCTAssertTrue(text.contains("Inventory scan: ok"))
        XCTAssertTrue(text.contains("Commands:"))
        XCTAssertTrue(text.contains("lsof -nP -Fpcuftn -iTCP -sTCP:LISTEN"))
        XCTAssertTrue(text.contains("Troubleshooting:"))
    }

    private func makeFixtureEnvironment() -> PortpourriCLIEnvironment {
        let watchedPorts = SnapshotService.defaultWatchedPorts
        let snapshot = SnapshotService.sampleSnapshot(watchedPorts: watchedPorts, fixtureName: "mixed")
        let service = SnapshotService()
        return PortpourriCLIEnvironment(
            watchedPorts: watchedPorts,
            fixtureCatalog: FixtureCatalog(),
            liveSnapshot: { snapshot },
            fixtureSnapshot: { name in
                guard name == "mixed" else { return nil }
                return snapshot
            },
            exportJSON: { try service.exportJSON(snapshot: $0) },
            doctorReport: {
                SnapshotDoctorReport(
                    generatedAt: Date(timeIntervalSince1970: 1_774_742_400),
                    watchedPorts: watchedPorts,
                    diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: "live"),
                    listenerProbe: ProbeCheckResult(status: .ok, detail: "Found 4 listeners"),
                    metadataEnrichment: ProbeCheckResult(status: .ok, detail: "Resolved 4 processes"),
                    inventoryScan: ProbeCheckResult(status: .ok, detail: "Found 6 node process groups")
                )
            }
        )
    }

    private func makeUnwatchedBusyEnvironment() -> PortpourriCLIEnvironment {
        let watchedPorts = [3000, 3001]
        let snapshot = AppSnapshot(
            generatedAt: Date(timeIntervalSince1970: 1_774_742_400),
            summary: SnapshotSummary(
                nodeProjectCount: 0,
                watchedBusyCount: 0,
                otherListenerCount: 1,
                watchedNonNodeConflictCount: 0
            ),
            watchedPorts: [
                WatchedPortStatus(port: 3000, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false),
                WatchedPortStatus(port: 3001, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false),
            ],
            projects: [],
            otherProcesses: [
                TrackedProcessSnapshot(
                    process: ProcessSnapshot(
                        pid: 7000,
                        ppid: 1,
                        state: "S",
                        uptime: "00:01",
                        commandLine: "python3 -m http.server 4040",
                        parentCommandLine: nil,
                        cwd: "/Users/example/tools",
                        isNodeFamily: false,
                        toolLabel: "python3"
                    ),
                    listeners: [],
                    ports: [4040],
                    isWatchedConflict: false
                )
            ],
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: "live")
        )
        let service = SnapshotService()
        return PortpourriCLIEnvironment(
            watchedPorts: watchedPorts,
            fixtureCatalog: FixtureCatalog(),
            liveSnapshot: { snapshot },
            fixtureSnapshot: { _ in nil },
            exportJSON: { try service.exportJSON(snapshot: $0) },
            doctorReport: {
                SnapshotDoctorReport(
                    generatedAt: snapshot.generatedAt,
                    watchedPorts: watchedPorts,
                    diagnostics: snapshot.diagnostics,
                    listenerProbe: ProbeCheckResult(status: .ok, detail: "Found 1 listener"),
                    metadataEnrichment: ProbeCheckResult(status: .ok, detail: "Resolved 1 process"),
                    inventoryScan: ProbeCheckResult(status: .ok, detail: "Found 0 node process groups")
                )
            }
        )
    }

    private func makeFixedSnapshot() -> AppSnapshot {
        AppSnapshot(
            generatedAt: Date(timeIntervalSince1970: 1_774_742_400),
            summary: SnapshotSummary(
                nodeProjectCount: 1,
                watchedBusyCount: 2,
                otherListenerCount: 1,
                watchedNonNodeConflictCount: 1,
                nodeProcessTotalCount: 3,
                nodeProcessTotalMemoryBytes: 150_994_944
            ),
            watchedPorts: [
                WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "vite (123)", isNodeOwned: true, isConflict: false),
                WatchedPortStatus(port: 5433, isBusy: true, ownerSummary: "python3 (456)", isNodeOwned: false, isConflict: true),
            ],
            projects: [
                ProjectSnapshot(
                    projectRoot: "/Users/example/acme/web",
                    displayName: "@acme/web",
                    processes: [
                        TrackedProcessSnapshot(
                            process: ProcessSnapshot(
                                pid: 123,
                                ppid: 1,
                                state: "S",
                                uptime: "00:10",
                                commandLine: "node /Users/example/acme/web/node_modules/.bin/vite",
                                parentCommandLine: "npm exec vite",
                                cwd: "/Users/example/acme/web",
                                isNodeFamily: true,
                                toolLabel: "vite"
                            ),
                            listeners: [
                                ListenerSnapshot(pid: 123, port: 3000, hostScope: .loopback, transport: .tcp4, commandName: "node"),
                            ],
                            ports: [3000],
                            isWatchedConflict: false
                        )
                    ],
                    ports: [3000],
                    isWorktreeLike: false
                )
            ],
            otherProcesses: [
                TrackedProcessSnapshot(
                    process: ProcessSnapshot(
                        pid: 456,
                        ppid: 1,
                        state: "S",
                        uptime: "00:05",
                        commandLine: "python3 -m http.server 5433",
                        parentCommandLine: nil,
                        cwd: "/Users/example/tools",
                        isNodeFamily: false,
                        toolLabel: "python3"
                    ),
                    listeners: [
                        ListenerSnapshot(pid: 456, port: 5433, hostScope: .loopback, transport: .tcp4, commandName: "python3"),
                    ],
                    ports: [5433],
                    isWatchedConflict: true
                )
            ],
            nodeProcessGroups: [
                NodeProcessGroup(toolLabel: "vite", count: 3, totalMemoryBytes: 150_994_944, pids: [123, 124, 125]),
            ],
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: "fixture")
        )
    }

    private func requireText(_ response: CLIResponse) throws -> String {
        guard case let .text(text) = response else {
            throw XCTSkip("Expected text response")
        }
        return text
    }

    private func requireData(_ response: CLIResponse) throws -> Data {
        guard case let .data(data) = response else {
            throw XCTSkip("Expected data response")
        }
        return data
    }
}
