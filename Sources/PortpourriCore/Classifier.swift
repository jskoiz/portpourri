import Foundation

struct NodeProcessClassifier {
    private let nodeLaunchers = ["node", "npm", "npx", "pnpm", "yarn", "bun", "tsx", "ts-node"]
    private let knownToolSequences: [([String], String)] = [
        (["next", "dev"], "next dev"),
        (["expo", "start"], "expo start"),
        (["storybook", "dev"], "storybook"),
        (["nest", "start"], "nest start"),
        (["astro", "dev"], "astro dev"),
    ]
    private let knownStandaloneTools = ["vite", "nuxt", "remix", "storybook", "tsx", "ts-node", "astro"]

    func classify(
        pid: Int,
        ppid: Int,
        state: String,
        uptime: String,
        commandLine: String,
        parentCommandLine: String?,
        cwd: String?
    ) -> ProcessSnapshot {
        let tokens = self.tokens(from: commandLine) + self.tokens(from: parentCommandLine ?? "")
        let isNodeFamily = self.isNodeFamily(tokens: tokens)
        let toolLabel = isNodeFamily
            ? self.nodeToolLabel(tokens: tokens, commandLine: commandLine, parentCommandLine: parentCommandLine)
            : self.executableLabel(from: commandLine)
        return ProcessSnapshot(
            pid: pid,
            ppid: ppid,
            state: state,
            uptime: uptime,
            commandLine: commandLine,
            parentCommandLine: parentCommandLine,
            cwd: cwd,
            isNodeFamily: isNodeFamily,
            toolLabel: toolLabel
        )
    }

    func isNodeFamily(commandLine: String, parentCommandLine: String?) -> Bool {
        let tokens = self.tokens(from: commandLine) + self.tokens(from: parentCommandLine ?? "")
        return self.isNodeFamily(tokens: tokens)
    }

    private func isNodeFamily(tokens: [String]) -> Bool {
        if tokens.contains(where: { self.nodeLaunchers.contains(self.basename(for: $0)) }) {
            return true
        }
        if tokens.contains(where: { $0.contains("/node_modules/.bin/") }) {
            return true
        }
        if self.knownStandaloneTools.contains(where: { tokens.contains($0) }) {
            return true
        }
        return self.knownToolSequences.contains { sequence, _ in
            self.contains(sequence: sequence, in: tokens)
        }
    }

    private func nodeToolLabel(tokens: [String], commandLine: String, parentCommandLine: String?) -> String {
        if let match = self.knownToolSequences.first(where: { self.contains(sequence: $0.0, in: tokens) }) {
            return match.1
        }

        if let binary = self.binaryToolLabel(from: commandLine) {
            return binary
        }

        if let binary = self.binaryToolLabel(from: parentCommandLine ?? "") {
            return binary
        }

        if let standalone = self.knownStandaloneTools.first(where: { tokens.contains($0) }) {
            return standalone
        }

        if self.contains(sequence: ["npm", "exec"], in: tokens) {
            return "npm exec"
        }

        if let launcher = tokens.map({ self.basename(for: $0) }).first(where: { self.nodeLaunchers.contains($0) }) {
            return launcher
        }

        return "node"
    }

    private func binaryToolLabel(from commandLine: String) -> String? {
        guard let range = commandLine.range(of: #"node_modules/\.bin/([^\s]+)"#, options: .regularExpression) else {
            return nil
        }
        let segment = String(commandLine[range])
        return segment.components(separatedBy: "/").last?.replacingOccurrences(of: "\"", with: "")
    }

    private func executableLabel(from commandLine: String) -> String {
        let firstToken = commandLine.split(separator: " ").first.map(String.init) ?? commandLine
        return URL(fileURLWithPath: firstToken).lastPathComponent
    }

    private func tokens(from commandLine: String) -> [String] {
        commandLine
            .split(whereSeparator: \.isWhitespace)
            .map { String($0).lowercased() }
    }

    private func basename(for token: String) -> String {
        URL(fileURLWithPath: token).lastPathComponent.lowercased()
    }

    private func contains(sequence: [String], in tokens: [String]) -> Bool {
        guard !sequence.isEmpty, tokens.count >= sequence.count else { return false }
        for start in 0...(tokens.count - sequence.count) {
            if Array(tokens[start..<(start + sequence.count)]) == sequence {
                return true
            }
        }
        return false
    }
}
