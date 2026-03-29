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

    // Non-Node dev server binaries (standalone executables)
    private let devServerBinaries: Set<String> = [
        "uvicorn", "gunicorn", "hypercorn", "daphne",  // Python ASGI/WSGI
        "flask",                                         // Flask CLI
        "puma", "unicorn", "rackup", "thin", "webrick", // Ruby servers
        "caddy",                                         // Caddy
        "air",                                           // Go live reload
        "hugo", "jekyll",                                // Static site generators
        "live-server", "http-server", "serve",           // npm-installed static servers
        "miniserve", "simple-http-server",               // Rust static servers
    ]

    // Token sequences that identify dev servers, paired with a display label
    private let devServerSequences: [([String], String)] = [
        (["python3", "-m", "http.server"], "python3 http.server"),
        (["python", "-m", "http.server"], "python http.server"),
        (["python3", "-m", "simplehttpserver"], "python3 SimpleHTTPServer"),
        (["python", "-m", "simplehttpserver"], "python SimpleHTTPServer"),
        (["python3", "manage.py", "runserver"], "django runserver"),
        (["python", "manage.py", "runserver"], "django runserver"),
        (["php", "-s"], "php -S"),
        (["go", "run"], "go run"),
        (["cargo", "run"], "cargo run"),
        (["ruby", "-run"], "ruby httpd"),
    ]

    // macOS internal system daemons — never shown to the user
    private let systemCommandDenylist: Set<String> = [
        "launchd", "mdnsresponder", "controlcenter", "rapportd", "configd",
        "remoted", "airplayxpchelper", "bluetoothd", "coreaudiod", "securityd",
        "airportd", "locationd", "distnoted", "notifyd", "cfprefsd",
        "opendirectoryd", "loginwindow", "powerd", "syslogd", "logd",
        "nsurlsessiond", "useractivityd", "remindd", "symptomsd",
        "usbd", "hidd", "diskarbitrationd", "mds", "mdworker_server",
        "softwareupdated", "trustd", "tccd", "amfid", "syspolicyd",
        "nesessionmanager", "netbiosd", "racoon", "socketfilterfw",
        "sharingd", "com.apple.webkit.networking", "wifid", "accessibilityd",
        "apsd", "callservicesd", "imagent", "commcenter",
    ]

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
        let isDevServer = !isNodeFamily && self.isDevServer(tokens: tokens)
        let toolLabel: String
        if isNodeFamily {
            toolLabel = self.nodeToolLabel(tokens: tokens, commandLine: commandLine, parentCommandLine: parentCommandLine)
        } else if isDevServer {
            toolLabel = self.devServerLabel(tokens: tokens, commandLine: commandLine)
        } else {
            toolLabel = self.executableLabel(from: commandLine)
        }
        return ProcessSnapshot(
            pid: pid,
            ppid: ppid,
            state: state,
            uptime: uptime,
            commandLine: commandLine,
            parentCommandLine: parentCommandLine,
            cwd: cwd,
            isNodeFamily: isNodeFamily,
            isDevServer: isDevServer,
            toolLabel: toolLabel
        )
    }

    func isNodeFamily(commandLine: String, parentCommandLine: String?) -> Bool {
        let tokens = self.tokens(from: commandLine) + self.tokens(from: parentCommandLine ?? "")
        return self.isNodeFamily(tokens: tokens)
    }

    func isSystemProcess(commandName: String) -> Bool {
        self.systemCommandDenylist.contains(commandName.lowercased())
    }

    private func isDevServer(tokens: [String]) -> Bool {
        guard let first = tokens.first else { return false }
        let baseName = self.basename(for: first)
        if self.devServerBinaries.contains(baseName) {
            return true
        }
        // Normalize first token to basename so full-path invocations still match
        // e.g. /Library/Frameworks/.../Python -m http.server → python -m http.server
        let normalized = [baseName] + Array(tokens.dropFirst())
        return self.devServerSequences.contains { sequence, _ in
            self.contains(sequence: sequence, in: normalized)
        }
    }

    private func devServerLabel(tokens: [String], commandLine: String) -> String {
        guard let first = tokens.first else { return self.executableLabel(from: commandLine) }
        let baseName = self.basename(for: first)
        let normalized = [baseName] + Array(tokens.dropFirst())
        if let match = self.devServerSequences.first(where: { self.contains(sequence: $0.0, in: normalized) }) {
            return match.1
        }
        if self.devServerBinaries.contains(baseName) {
            return baseName
        }
        return self.executableLabel(from: commandLine)
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
