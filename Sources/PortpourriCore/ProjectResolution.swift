import Foundation

public struct DefaultProjectResolver: ProjectResolving {
    private let markers = [
        "package.json",
        ".git",
        "pnpm-workspace.yaml",
        "turbo.json",
        "nx.json",
        "yarn.lock",
        "package-lock.json",
        "bun.lockb",
        "bun.lock",
    ]

    public init() {}

    public func resolveProject(for process: ProcessSnapshot) -> ResolvedProject? {
        guard let cwd = process.cwd, !cwd.isEmpty else { return nil }
        let cwdURL = URL(fileURLWithPath: cwd, isDirectory: true)
        guard let root = self.findProjectRoot(startingAt: cwdURL) else {
            return ResolvedProject(
                rootPath: cwd,
                displayName: self.fallbackDisplayName(for: cwdURL),
                isWorktreeLike: self.isWorktreeLike(path: cwd)
            )
        }

        let displayName = self.packageName(in: root) ?? self.fallbackDisplayName(for: root)
        return ResolvedProject(
            rootPath: root.path,
            displayName: displayName,
            isWorktreeLike: self.isWorktreeLike(path: root.path)
        )
    }

    private func findProjectRoot(startingAt startURL: URL) -> URL? {
        var candidate = startURL
        let root = URL(fileURLWithPath: "/")

        while true {
            if self.markers.contains(where: { FileManager.default.fileExists(atPath: candidate.appendingPathComponent($0).path) }) {
                return candidate
            }
            if candidate == root { return nil }
            candidate.deleteLastPathComponent()
        }
    }

    private func packageName(in directory: URL) -> String? {
        let packageURL = directory.appendingPathComponent("package.json")
        guard let data = try? Data(contentsOf: packageURL),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        return object["name"] as? String
    }

    private func fallbackDisplayName(for directory: URL) -> String {
        if directory.path == "/" {
            return "System"
        }

        let name = directory.lastPathComponent.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? "Unknown project" : name
    }

    private func isWorktreeLike(path: String) -> Bool {
        path.contains("/.claude/worktrees/") || path.contains("/.git/worktrees/")
    }
}
