import Foundation
import XCTest
@testable import NodeTrackerCore

final class ProjectResolverTests: XCTestCase {
    func testResolvesPackageNameFromNearestProjectRoot() throws {
        let root = try self.makeTempDirectory()
        let appRoot = root.appendingPathComponent("apps/web", isDirectory: true)
        try FileManager.default.createDirectory(at: appRoot, withIntermediateDirectories: true)
        let packageJSON = appRoot.appendingPathComponent("package.json")
        try Data(#"{"name":"@acme/web"}"#.utf8).write(to: packageJSON)

        let process = ProcessSnapshot(
            pid: 1,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "node vite",
            parentCommandLine: "npm exec vite",
            cwd: appRoot.appendingPathComponent("src/pages", isDirectory: true).path,
            isNodeFamily: true,
            toolLabel: "vite"
        )

        try FileManager.default.createDirectory(
            atPath: process.cwd ?? "",
            withIntermediateDirectories: true
        )

        let resolved = DefaultProjectResolver().resolveProject(for: process)
        XCTAssertEqual(resolved?.displayName, "@acme/web")
        XCTAssertEqual(resolved?.rootPath, appRoot.path)
    }

    func testDetectsWorktreeLikePaths() {
        let process = ProcessSnapshot(
            pid: 1,
            ppid: 0,
            state: "S",
            uptime: "00:01",
            commandLine: "node expo start",
            parentCommandLine: "npm exec expo start",
            cwd: "/Users/example/repo/.claude/worktrees/abc/mobile",
            isNodeFamily: true,
            toolLabel: "expo start"
        )

        let resolved = DefaultProjectResolver().resolveProject(for: process)
        XCTAssertEqual(resolved?.displayName, "mobile")
        XCTAssertEqual(resolved?.isWorktreeLike, true)
    }

    private func makeTempDirectory() throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
}
