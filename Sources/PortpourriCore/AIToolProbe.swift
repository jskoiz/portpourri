import Foundation

public protocol AIToolProbing: Sendable {
    func scan() throws -> AIToolSnapshot
}

public struct AIToolProbe: AIToolProbing, Sendable {
    private let homeDir: String

    public init(homeDir: String = NSHomeDirectory()) {
        self.homeDir = homeDir
    }

    public func scan() throws -> AIToolSnapshot {
        let fm = FileManager.default
        let claudeBase = (self.homeDir as NSString).appendingPathComponent(".claude")
        let codexBase = (self.homeDir as NSString).appendingPathComponent(".codex")

        // Claude Code worktrees: ~/.claude/projects/*/worktrees/* and per-project .claude/worktrees/*
        var claudeWorktrees: [AIWorktreeEntry] = []

        // Global Claude worktrees in ~/.claude/projects/
        let projectsDir = (claudeBase as NSString).appendingPathComponent("projects")
        if fm.fileExists(atPath: projectsDir) {
            let projectDirs = (try? fm.contentsOfDirectory(atPath: projectsDir)) ?? []
            for projectDir in projectDirs {
                let worktreesPath = (projectsDir as NSString)
                    .appendingPathComponent(projectDir)
                let worktreeSubDir = (worktreesPath as NSString)
                    .appendingPathComponent("worktrees")
                guard fm.fileExists(atPath: worktreeSubDir) else { continue }
                let entries = (try? fm.contentsOfDirectory(atPath: worktreeSubDir)) ?? []
                for entry in entries where !entry.hasPrefix(".") {
                    let fullPath = (worktreeSubDir as NSString).appendingPathComponent(entry)
                    var isDir: ObjCBool = false
                    guard fm.fileExists(atPath: fullPath, isDirectory: &isDir), isDir.boolValue else { continue }
                    let size = Self.directorySize(at: fullPath)
                    let modified = Self.directoryLastModified(at: fullPath)
                    let projectName = Self.decodeProjectName(projectDir)
                    claudeWorktrees.append(AIWorktreeEntry(
                        path: fullPath,
                        name: entry,
                        sizeBytes: size,
                        projectName: projectName,
                        lastModified: modified
                    ))
                }
            }
        }

        // Per-project Claude worktrees found via known project roots
        let desktopPath = (self.homeDir as NSString).appendingPathComponent("Desktop")
        if fm.fileExists(atPath: desktopPath) {
            Self.findPerProjectWorktrees(under: desktopPath, depth: 0, maxDepth: 4, into: &claudeWorktrees)
        }

        // Deduplicate by path
        var seenPaths: Set<String> = []
        claudeWorktrees = claudeWorktrees.filter { seenPaths.insert($0.path).inserted }

        // Codex worktrees: ~/.codex/worktrees/*
        var codexWorktrees: [AIWorktreeEntry] = []
        let codexWorktreesDir = (codexBase as NSString).appendingPathComponent("worktrees")
        if fm.fileExists(atPath: codexWorktreesDir) {
            let entries = (try? fm.contentsOfDirectory(atPath: codexWorktreesDir)) ?? []
            for entry in entries where !entry.hasPrefix(".") {
                let fullPath = (codexWorktreesDir as NSString).appendingPathComponent(entry)
                var isDir: ObjCBool = false
                guard fm.fileExists(atPath: fullPath, isDirectory: &isDir), isDir.boolValue else { continue }
                let size = Self.directorySize(at: fullPath)
                let modified = Self.directoryLastModified(at: fullPath)
                codexWorktrees.append(AIWorktreeEntry(
                    path: fullPath,
                    name: entry,
                    sizeBytes: size,
                    projectName: nil,
                    lastModified: modified
                ))
            }
        }

        // Session counts
        let claudeSessionCount = Self.countEntries(at: (claudeBase as NSString).appendingPathComponent("sessions"))
        let codexActiveCount = Self.countEntries(at: (codexBase as NSString).appendingPathComponent("sessions"))
        let codexArchivedCount = Self.countEntries(at: (codexBase as NSString).appendingPathComponent("archived_sessions"))
        let codexSessionCount = codexActiveCount + codexArchivedCount

        let claudeTotal = claudeWorktrees.reduce(Int64(0)) { $0 + $1.sizeBytes }
        let codexTotal = codexWorktrees.reduce(Int64(0)) { $0 + $1.sizeBytes }

        return AIToolSnapshot(
            claudeWorktrees: claudeWorktrees.sorted { $0.sizeBytes > $1.sizeBytes },
            codexWorktrees: codexWorktrees.sorted { $0.sizeBytes > $1.sizeBytes },
            claudeSessionCount: claudeSessionCount,
            codexSessionCount: codexSessionCount,
            totalSizeBytes: claudeTotal + codexTotal
        )
    }

    // MARK: - Helpers

    private static func directorySize(at path: String) -> Int64 {
        let fm = FileManager.default
        guard let enumerator = fm.enumerator(
            at: URL(fileURLWithPath: path),
            includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey],
            options: [.skipsHiddenFiles]
        ) else { return 0 }

        var total: Int64 = 0
        for case let fileURL as URL in enumerator {
            guard let values = try? fileURL.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey]),
                  values.isRegularFile == true,
                  let size = values.fileSize else { continue }
            total += Int64(size)
        }
        return total
    }

    private static func directoryLastModified(at path: String) -> Date {
        let fm = FileManager.default
        // Use the directory's own modification date (updated when contents change)
        if let attrs = try? fm.attributesOfItem(atPath: path),
           let modified = attrs[.modificationDate] as? Date {
            return modified
        }
        return Date.distantPast
    }

    private static func countEntries(at path: String) -> Int {
        let fm = FileManager.default
        guard fm.fileExists(atPath: path) else { return 0 }
        return (try? fm.contentsOfDirectory(atPath: path))?.count ?? 0
    }

    private static func decodeProjectName(_ encoded: String) -> String {
        // ~/.claude/projects/ uses "-" as path separator: -Users-jerry-Desktop-foo → ~/Desktop/foo
        let decoded = encoded.replacingOccurrences(of: "-", with: "/")
        let abbreviated = (decoded as NSString).abbreviatingWithTildeInPath
        return abbreviated
    }

    private static func findPerProjectWorktrees(
        under dir: String,
        depth: Int,
        maxDepth: Int,
        into results: inout [AIWorktreeEntry]
    ) {
        guard depth < maxDepth else { return }
        let fm = FileManager.default
        let entries = (try? fm.contentsOfDirectory(atPath: dir)) ?? []
        for entry in entries where !entry.hasPrefix(".") {
            let fullPath = (dir as NSString).appendingPathComponent(entry)
            var isDir: ObjCBool = false
            guard fm.fileExists(atPath: fullPath, isDirectory: &isDir), isDir.boolValue else { continue }

            // Check for .claude/worktrees/ inside this directory
            let worktreesPath = (fullPath as NSString)
                .appendingPathComponent(".claude/worktrees")
            if fm.fileExists(atPath: worktreesPath) {
                let worktreeEntries = (try? fm.contentsOfDirectory(atPath: worktreesPath)) ?? []
                for wt in worktreeEntries where !wt.hasPrefix(".") {
                    let wtPath = (worktreesPath as NSString).appendingPathComponent(wt)
                    var wtIsDir: ObjCBool = false
                    guard fm.fileExists(atPath: wtPath, isDirectory: &wtIsDir), wtIsDir.boolValue else { continue }
                    let size = directorySize(at: wtPath)
                    let modified = directoryLastModified(at: wtPath)
                    results.append(AIWorktreeEntry(
                        path: wtPath,
                        name: wt,
                        sizeBytes: size,
                        projectName: entry,
                        lastModified: modified
                    ))
                }
            }

            // Recurse into subdirectories
            findPerProjectWorktrees(under: fullPath, depth: depth + 1, maxDepth: maxDepth, into: &results)
        }
    }
}
