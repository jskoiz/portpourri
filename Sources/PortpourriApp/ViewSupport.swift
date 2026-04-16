import AppKit
import SwiftUI
import PortpourriCore

// MARK: - Header

struct CompactHeader: View {
    let snapshot: AppSnapshot
    let useSampleData: Bool
    let conflictCount: Int
    let projectCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("Portpourri")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text(self.useSampleData ? "Sample data mode" : self.relativeUpdatedText)
                    .font(.caption)
                    .foregroundStyle(Readability.secondaryText)
            }

            self.summaryLine
                .font(.caption)
                .foregroundStyle(.primary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(self.accessibilitySummary)
    }

    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    private var relativeUpdatedText: String {
        let elapsed = Date().timeIntervalSince(self.snapshot.generatedAt)
        guard elapsed > 3 else { return "Updated just now" }
        return "Updated \(Self.relativeDateFormatter.localizedString(fromTimeInterval: -elapsed))"
    }

    private var summaryLine: Text {
        var parts: [Text] = []
        for part in self.summaryParts {
            switch part.kind {
            case .conflict:
                parts.append(
                    Text(part.text)
                        .foregroundColor(Palette.mutedRed)
                        .fontWeight(.medium)
                )
            case .default:
                parts.append(Text(part.text))
            }
        }
        let separator = Text("  \u{00B7}  ").foregroundColor(Readability.secondaryText)
        var result = Text("")
        for (i, part) in parts.enumerated() {
            if i > 0 { result = result + separator }
            result = result + part
        }
        return result
    }

    private var accessibilitySummary: String {
        let status = self.useSampleData ? "Sample data mode" : self.relativeUpdatedText
        let summary = self.summaryParts.map(\.text).joined(separator: ", ")
        return ["Portpourri", status, summary]
            .filter { !$0.isEmpty }
            .joined(separator: ". ")
    }

    private var summaryParts: [HeaderSummaryPart] {
        var parts: [HeaderSummaryPart] = []
        if self.conflictCount > 0 {
            parts.append(HeaderSummaryPart(text: "\(self.conflictCount) conflict\(self.conflictCount == 1 ? "" : "s")", kind: .conflict))
        }
        if self.projectCount > 0 {
            parts.append(HeaderSummaryPart(text: "\(self.projectCount) running", kind: .default))
        }
        return parts
    }
}

// MARK: - Shared Components

struct ProcessActionsMenu: View {
    @ObservedObject var store: PortpourriStore
    let process: TrackedProcessSnapshot
    let portContext: Int?
    let canTerminate: Bool

    var body: some View {
        Menu {
            Button("Copy PID") {
                self.store.copyText(String(self.process.process.pid), label: "PID")
            }
            Button("Copy command") {
                self.store.copyText(self.process.process.commandLine, label: "Command")
            }
            if self.canTerminate {
                Divider()
                Button(self.terminateLabel, role: .destructive) {
                    self.store.terminate(process: self.process, portContext: self.portContext)
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text("More")
                Image(systemName: "ellipsis")
                    .font(.caption2)
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .menuStyle(BorderlessButtonMenuStyle())
        .accessibilityLabel("More actions for PID \(self.process.process.pid)")
        .accessibilityHint("Copy process details or terminate the selected process.")
    }

    private var terminateLabel: String {
        DestructiveActionAdvisor.kind(for: self.process, portContext: self.portContext)?.label ?? "Stop process"
    }
}

struct DisclosureToggle: View {
    let title: String
    let countText: String
    @Binding var isExpanded: Bool

    var body: some View {
        Button {
            self.isExpanded.toggle()
        } label: {
            HStack(alignment: .firstTextBaseline) {
                Text(self.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                Text(self.countText)
                    .font(.caption)
                    .foregroundStyle(Readability.secondaryText)
                Image(systemName: self.isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(self.title), \(self.countText)")
        .accessibilityHint(self.isExpanded ? "Collapse this section." : "Expand this section.")
    }
}

struct CompactRowDivider: View {
    var body: some View {
        Divider()
            .overlay(Color.primary.opacity(LayoutMetrics.compactDividerOpacity))
    }
}

// MARK: - Accent & Styling

enum AccentTone {
    case neutral
    case node
    case amber
    case conflict

    var fill: Color {
        switch self {
        case .neutral: Color.primary.opacity(0.06)
        case .node: Palette.softGreenFill
        case .amber: Palette.softAmberFill
        case .conflict: Palette.softRedFill
        }
    }

    var foreground: Color {
        switch self {
        case .neutral: .primary
        case .node: Palette.mutedGreen
        case .amber: Palette.mutedAmber
        case .conflict: Palette.mutedRed
        }
    }

    var solidBackground: Color {
        switch self {
        case .node: Palette.mutedGreen
        case .amber: Palette.mutedAmber
        case .conflict: Palette.mutedRed
        case .neutral: Color.primary.opacity(0.45)
        }
    }
}

enum Palette {
    static let mutedRed = Color(nsColor: NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1))
    static let mutedGreen = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1))
    static let mutedAmber = Color(nsColor: NSColor(calibratedRed: 0.75, green: 0.55, blue: 0.20, alpha: 1))
    static let softGreenFill = Color(nsColor: NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1)).opacity(0.10)
    static let softAmberFill = Color(nsColor: NSColor(calibratedRed: 0.75, green: 0.55, blue: 0.20, alpha: 1)).opacity(0.10)
    static let softRedFill = Color(nsColor: NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1)).opacity(0.10)
}

enum Readability {
    static let secondaryText = Color.primary.opacity(0.78)
}

struct PortBadge: View {
    let port: Int
    let tone: AccentTone

    var body: some View {
        Text(verbatim: String(self.port))
            .font(.system(.caption2, design: .monospaced))
            .fontWeight(.semibold)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(self.tone.fill, in: Capsule())
            .accessibilityLabel("Port \(self.port)")
    }
}

struct PortBadgeRow: View {
    let ports: [Int]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(self.ports, id: \.self) { port in
                PortBadge(port: port, tone: .neutral)
            }
        }
    }
}

struct StatusTag: View {
    let text: String
    let tone: AccentTone

    var body: some View {
        Text(self.text)
            .font(.system(size: 9, weight: .semibold))
            .foregroundStyle(self.tone.foreground)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(self.tone.fill, in: Capsule())
            .accessibilityLabel(self.text)
    }
}

struct InlineTextButton: View {
    let title: String
    let accessibilityLabel: String?
    let accessibilityHint: String?
    let action: () -> Void

    init(
        _ title: String,
        accessibilityLabel: String? = nil,
        accessibilityHint: String? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.accessibilityLabel = accessibilityLabel
        self.accessibilityHint = accessibilityHint
        self.action = action
    }

    var body: some View {
        Button(action: self.action) {
            Text(self.title)
                .font(.caption)
                .foregroundStyle(Readability.secondaryText)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(self.accessibilityLabel ?? self.title)
        .accessibilityHint(self.accessibilityHint ?? "")
    }
}

struct InlineAccentButton: View {
    let title: String
    let tone: AccentTone
    let accessibilityLabel: String?
    let accessibilityHint: String?
    let action: () -> Void

    init(
        _ title: String,
        tone: AccentTone,
        accessibilityLabel: String? = nil,
        accessibilityHint: String? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.tone = tone
        self.accessibilityLabel = accessibilityLabel
        self.accessibilityHint = accessibilityHint
        self.action = action
    }

    var body: some View {
        Button(action: self.action) {
            Text(self.title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Color.white.opacity(0.70))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(self.tone.solidBackground, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(self.accessibilityLabel ?? self.title)
        .accessibilityHint(self.accessibilityHint ?? "")
    }
}

struct IssueCalloutView: View {
    let issue: AppIssue

    private var iconName: String {
        switch self.issue.severity {
        case .warning: "exclamationmark.triangle"
        case .error: "xmark.octagon"
        }
    }

    private var tone: AccentTone {
        switch self.issue.severity {
        case .warning: .amber
        case .error: .conflict
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(self.issue.title, systemImage: self.iconName)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(self.tone.foreground)

            if let recoverySuggestion = self.issue.recoverySuggestion {
                Text(recoverySuggestion)
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }

            if let detail = self.issue.detail, !detail.isEmpty {
                Text(detail)
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
                    .textSelection(.enabled)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(self.tone.fill, in: RoundedRectangle(cornerRadius: LayoutMetrics.cardCornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: LayoutMetrics.cardCornerRadius)
                .stroke(self.tone.foreground.opacity(0.18), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel(self.issue.accessibilityText)
    }
}

// MARK: - Visual Effects

struct PopoverMaterialBackground: View {
    var body: some View {
        ZStack {
            VisualEffectView(material: .popover, blendingMode: .behindWindow, state: .active)
            Color.white.opacity(0.10)
        }
        .ignoresSafeArea()
    }
}

struct PopoverCapsuleBackground: View {
    var body: some View {
        ZStack {
            VisualEffectView(material: .sidebar, blendingMode: .withinWindow, state: .active)
            Color.white.opacity(0.12)
        }
    }
}

struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode
    let state: NSVisualEffectView.State

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = self.material
        view.blendingMode = self.blendingMode
        view.state = self.state
        view.isEmphasized = false
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = self.material
        nsView.blendingMode = self.blendingMode
        nsView.state = self.state
        nsView.isEmphasized = false
    }
}

// MARK: - AI Tools Section

struct AIToolsSection: View {
    let aiSnapshot: AIToolSnapshot
    @Binding var isExpanded: Bool

    private var totalWorktrees: Int {
        self.aiSnapshot.claudeWorktrees.count + self.aiSnapshot.codexWorktrees.count
    }

    private var formattedSize: String {
        let mb = Double(self.aiSnapshot.totalSizeBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            DisclosureToggle(
                title: "AI tools",
                countText: "\(self.totalWorktrees) worktree\(self.totalWorktrees == 1 ? "" : "s") \u{00B7} \(self.formattedSize)",
                isExpanded: self.$isExpanded
            )

            if self.isExpanded {
                VStack(alignment: .leading, spacing: 4) {
                    if !self.aiSnapshot.claudeWorktrees.isEmpty {
                        AIToolGroupView(
                            label: "Claude Code",
                            sessionCount: self.aiSnapshot.claudeSessionCount,
                            worktrees: self.aiSnapshot.claudeWorktrees
                        )
                    }
                    if !self.aiSnapshot.codexWorktrees.isEmpty {
                        AIToolGroupView(
                            label: "Codex",
                            sessionCount: self.aiSnapshot.codexSessionCount,
                            worktrees: self.aiSnapshot.codexWorktrees
                        )
                    }
                }
                .padding(.leading, 4)
            }
        }
    }
}

struct AIToolGroupView: View {
    let label: String
    let sessionCount: Int
    let worktrees: [AIWorktreeEntry]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(self.label)
                    .font(.caption)
                    .fontWeight(.medium)
                Text("\(self.worktrees.count) worktree\(self.worktrees.count == 1 ? "" : "s") \u{00B7} \(self.sessionCount) session\(self.sessionCount == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundStyle(Readability.secondaryText)
            }
            ForEach(self.worktrees, id: \.path) { wt in
                HStack(spacing: 6) {
                    Text(wt.name)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    if let project = wt.projectName {
                        Text(project)
                            .font(.caption2)
                            .foregroundStyle(Readability.secondaryText)
                            .lineLimit(1)
                    }
                    if Self.isStale(wt) {
                        StatusTag(text: "stale", tone: .amber)
                    }
                    Spacer(minLength: 4)
                    Text(Self.formattedSize(wt.sizeBytes))
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(Readability.secondaryText)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }

    private static func isStale(_ entry: AIWorktreeEntry) -> Bool {
        entry.isStale
    }

    private static func formattedSize(_ bytes: Int64) -> String {
        AIWorktreeEntry(path: "", name: "", sizeBytes: bytes, projectName: nil).formattedSize
    }
}

// MARK: - Business Logic

typealias ProcessActionPolicy = DestructiveActionPolicy

struct ResolutionAction {
    enum Kind {
        case terminate
        case openApplication(String)
    }

    let title: String
    let tone: AccentTone
    let kind: Kind
}

private struct HeaderSummaryPart {
    enum Kind {
        case `default`
        case conflict
    }

    let text: String
    let kind: Kind
}

enum ResolutionAdvisor {
    static func primaryAction(for process: TrackedProcessSnapshot, portContext: Int?) -> ResolutionAction? {
        let command = process.process.commandLine

        if self.applicationBundlePath(from: command)?.localizedCaseInsensitiveContains("/Docker.app") == true {
            return nil
        }

        if let kind = DestructiveActionAdvisor.kind(for: process, portContext: portContext) {
            let tone: AccentTone
            switch kind {
            case .stopServer, .freePort:
                tone = .node
            case .stopTunnel, .stopBlocker, .killGroup:
                tone = .conflict
            }
            return ResolutionAction(title: kind.label, tone: tone, kind: .terminate)
        }

        return nil
    }

    private static func applicationBundlePath(from commandLine: String) -> String? {
        let pattern = #"(/[^ ]+?\.app)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(commandLine.startIndex..<commandLine.endIndex, in: commandLine)
        guard let match = regex.firstMatch(in: commandLine, range: range),
              let resultRange = Range(match.range(at: 1), in: commandLine) else {
            return nil
        }
        return String(commandLine[resultRange])
    }
}

// MARK: - Data Helpers

enum SnapshotDetails {
    static func processes(for port: Int, from processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        sortedProcesses(processes.compactMap { self.process($0, matching: port) })
    }

    static func projects(for port: Int, from projects: [ProjectSnapshot]) -> [ProjectSnapshot] {
        sortedProjects(projects.compactMap { project in
            let processes = project.processes.compactMap { self.process($0, matching: port) }
            guard !processes.isEmpty else { return nil }
            return ProjectSnapshot(
                projectRoot: project.projectRoot,
                displayName: project.displayName,
                processes: processes,
                ports: [port],
                isWorktreeLike: project.isWorktreeLike
            )
        })
    }

    static func sortedProjects(_ projects: [ProjectSnapshot]) -> [ProjectSnapshot] {
        projects.sorted { lhs, rhs in
            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let nameComparison = lhs.displayName.localizedCaseInsensitiveCompare(rhs.displayName)
            if nameComparison != .orderedSame {
                return nameComparison == .orderedAscending
            }

            if lhs.isWorktreeLike != rhs.isWorktreeLike {
                return lhs.isWorktreeLike == false
            }

            return lhs.projectRoot < rhs.projectRoot
        }
    }

    static func sortedProcesses(_ processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        processes.sorted { lhs, rhs in
            let lhsPort = lhs.ports.min() ?? .max
            let rhsPort = rhs.ports.min() ?? .max
            if lhsPort != rhsPort {
                return lhsPort < rhsPort
            }

            let labelComparison = lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel)
            if labelComparison != .orderedSame {
                return labelComparison == .orderedAscending
            }

            return lhs.process.pid < rhs.process.pid
        }
    }

    private static func process(_ process: TrackedProcessSnapshot, matching port: Int) -> TrackedProcessSnapshot? {
        let listeners = process.listeners.filter { $0.port == port }
        let ports = process.ports.filter { $0 == port }
        guard !ports.isEmpty else { return nil }
        return TrackedProcessSnapshot(
            process: process.process,
            listeners: listeners,
            ports: ports,
            isWatchedConflict: process.isWatchedConflict
        )
    }
}

// MARK: - Display Text

enum DisplayText {
    static func compareWatchedPorts(_ lhs: WatchedPortStatus, _ rhs: WatchedPortStatus) -> Bool {
        if lhs.isConflict != rhs.isConflict {
            return lhs.isConflict && !rhs.isConflict
        }
        if lhs.isBusy != rhs.isBusy {
            return lhs.isBusy && !rhs.isBusy
        }
        if lhs.isNodeOwned != rhs.isNodeOwned {
            return !lhs.isNodeOwned && rhs.isNodeOwned
        }
        return lhs.port < rhs.port
    }

    static func path(_ path: String) -> String {
        NSString(string: path).abbreviatingWithTildeInPath
    }

    static func watchedPortHeadline(_ status: WatchedPortStatus) -> String {
        let owner = self.watchedPortOwner(status)
        if !status.isBusy {
            return "Free"
        }
        if !status.isNodeOwned {
            return owner
        }
        if status.isNodeOwned, !status.isConflict {
            return owner
        }
        return "In use by \(owner)"
    }

    static func blockerDetail(_ process: TrackedProcessSnapshot) -> String {
        "PID \(process.process.pid)"
    }

    static func blockerHoverDetail(_ process: TrackedProcessSnapshot) -> String? {
        guard let cwd = process.process.cwd, cwd != "/" else { return nil }
        return self.path(cwd)
    }

    static func processDetail(_ process: ProcessSnapshot) -> String? {
        let command = self.command(process)
        let executablePath = self.executablePath(process.commandLine)

        if command.localizedCaseInsensitiveCompare(process.toolLabel) == .orderedSame {
            if executablePath != command {
                return executablePath
            }
            return nil
        }

        return command
    }

    static func toolsSummary(_ processes: [TrackedProcessSnapshot]) -> String {
        let tools = Array(Set(processes.map(\.process.toolLabel))).sorted()
        return tools.joined(separator: " \u{2022} ")
    }

    private static func watchedPortOwner(_ status: WatchedPortStatus) -> String {
        let owners = status.ownerSummary
            .split(separator: ",")
            .map { stripPID(from: $0.trimmingCharacters(in: .whitespacesAndNewlines)) }

        guard let firstOwner = owners.first, !firstOwner.isEmpty else {
            return "another process"
        }

        if owners.count == 1 {
            return firstOwner
        }

        return "\(firstOwner) +\(owners.count - 1)"
    }

    private static func command(_ process: ProcessSnapshot) -> String {
        let normalized = normalizeCommand(process.commandLine, cwd: process.cwd)
        let tokens = normalized
            .split(whereSeparator: \.isWhitespace)
            .map(String.init)
        guard !tokens.isEmpty else { return normalized }

        if tokens.count >= 2, basename(tokens[0]) == "node" {
            let launched = tokens[1]
            if launched.contains("/node_modules/.bin/") {
                let simplified = [basename(launched)] + Array(tokens.dropFirst(2))
                return trimmed(simplified.joined(separator: " "))
            }
        }

        var displayTokens = tokens
        displayTokens[0] = basename(displayTokens[0])
        return trimmed(displayTokens.joined(separator: " "))
    }

    private static func normalizeCommand(_ command: String, cwd: String?) -> String {
        guard let cwd, !cwd.isEmpty, cwd != "/" else { return command }
        let cwdWithSlash = cwd.hasSuffix("/") ? cwd : cwd + "/"
        return command
            .replacingOccurrences(of: cwdWithSlash, with: "")
            .replacingOccurrences(of: cwd, with: ".")
    }

    private static func executablePath(_ commandLine: String) -> String {
        let token = commandLine.split(whereSeparator: \.isWhitespace).first.map(String.init) ?? commandLine
        if token.hasPrefix("/") {
            return path(token)
        }
        return token
    }

    private static func basename(_ token: String) -> String {
        URL(fileURLWithPath: token).lastPathComponent
    }

    private static func stripPID(from owner: String) -> String {
        owner.replacingOccurrences(of: #"\s*\(\d+\)$"#, with: "", options: .regularExpression)
    }

    private static func trimmed(_ command: String) -> String {
        let tokens = command.split(whereSeparator: \.isWhitespace)
        if tokens.count <= 6 {
            return command
        }
        return tokens.prefix(6).joined(separator: " ") + " \u{2026}"
    }
}
