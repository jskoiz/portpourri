import XCTest
@testable import NodeTrackerCore

final class SnapshotServiceTests: XCTestCase {
    func testProjectsSortDeterministicallyWhenDisplayNamesMatch() throws {
        let listenerProbe = StaticListenerProbe(items: [
            ListenerSnapshot(pid: 202, port: 6006, hostScope: .any, transport: .tcp6, commandName: "node"),
            ListenerSnapshot(pid: 101, port: 8081, hostScope: .any, transport: .tcp6, commandName: "node"),
        ])

        let processProbe = StaticProcessProbe(
            processes: [
                202: ProcessSnapshot(
                    pid: 202,
                    ppid: 1,
                    state: "S",
                    uptime: "00:01",
                    commandLine: "node /repo/.claude/worktrees/abc/mobile/node_modules/.bin/storybook dev -p 6006",
                    parentCommandLine: "npm exec storybook dev -p 6006",
                    cwd: "/repo/.claude/worktrees/abc/mobile",
                    isNodeFamily: true,
                    toolLabel: "storybook"
                ),
                101: ProcessSnapshot(
                    pid: 101,
                    ppid: 1,
                    state: "S",
                    uptime: "00:01",
                    commandLine: "node /repo/mobile/node_modules/.bin/expo start --port 8081",
                    parentCommandLine: "npm exec expo start --port 8081",
                    cwd: "/repo/mobile",
                    isNodeFamily: true,
                    toolLabel: "expo start"
                ),
            ],
            cwd: [
                202: "/repo/.claude/worktrees/abc/mobile",
                101: "/repo/mobile",
            ]
        )

        let resolver = StaticProjectResolver(projectsByPID: [
            101: ResolvedProject(rootPath: "/repo/mobile", displayName: "mobile", isWorktreeLike: false),
            202: ResolvedProject(rootPath: "/repo/.claude/worktrees/abc/mobile", displayName: "mobile", isWorktreeLike: true),
        ])

        let service = SnapshotService(
            listenerProbe: listenerProbe,
            metadataProbe: processProbe,
            projectResolver: resolver
        )

        let first = try service.captureLiveSnapshot(watchedPorts: [8081, 6006])
        let second = try service.captureLiveSnapshot(watchedPorts: [8081, 6006])

        let expectedRoots = [
            "/repo/mobile",
            "/repo/.claude/worktrees/abc/mobile",
        ]

        XCTAssertEqual(first.projects.map { $0.projectRoot }, expectedRoots)
        XCTAssertEqual(second.projects.map { $0.projectRoot }, expectedRoots)
        XCTAssertEqual(first.projects.map { $0.displayName }, ["mobile", "mobile"])
        XCTAssertEqual(first.projects.map { $0.isWorktreeLike }, [false, true])
    }
}

private struct StaticListenerProbe: ListenerProbing {
    let items: [ListenerSnapshot]

    func listeners() throws -> [ListenerSnapshot] {
        self.items
    }
}

private struct StaticProcessProbe: ProcessMetadataProbing {
    let processes: [Int: ProcessSnapshot]
    let cwd: [Int: String]

    func processes(for pids: [Int]) throws -> [Int: ProcessSnapshot] {
        if pids.isEmpty {
            return [:]
        }
        return self.processes.filter { pids.contains($0.key) }
    }

    func currentWorkingDirectories(for pids: [Int]) throws -> [Int: String] {
        if pids.isEmpty {
            return [:]
        }
        return self.cwd.filter { pids.contains($0.key) }
    }
}

private struct StaticProjectResolver: ProjectResolving {
    let projectsByPID: [Int: ResolvedProject]

    func resolveProject(for process: ProcessSnapshot) -> ResolvedProject? {
        self.projectsByPID[process.pid]
    }
}
