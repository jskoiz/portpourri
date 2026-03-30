import AppKit
import Darwin
import Foundation
import PortpourriCore
import ServiceManagement
import UserNotifications

enum RefreshCadence: Double, CaseIterable, Identifiable {
    case fifteenSeconds = 15
    case oneMinute = 60
    case fiveMinutes = 300

    var id: Double { self.rawValue }

    var label: String {
        switch self {
        case .fifteenSeconds: "15 seconds"
        case .oneMinute: "1 minute"
        case .fiveMinutes: "5 minutes"
        }
    }
}

enum MenuBarDisplayMode: String, CaseIterable, Identifiable {
    case countAndMemory
    case countOnly
    case memoryOnly
    case iconOnly
    case dotMatrix

    var id: String { self.rawValue }

    var label: String {
        switch self {
        case .countAndMemory: "Projects + Memory"
        case .countOnly: "Project Count"
        case .memoryOnly: "Memory Usage"
        case .iconOnly: "Icon Only"
        case .dotMatrix: "Dot Matrix"
        }
    }

    var description: String {
        switch self {
        case .countAndMemory: "3 \u{00B7} 2.1G"
        case .countOnly: "3"
        case .memoryOnly: "2.1G"
        case .iconOnly: "N"
        case .dotMatrix: "\u{25CF}\u{25CF}\u{25CB} port status"
        }
    }
}

enum GroupMode: String, CaseIterable, Identifiable {
    case project
    case port

    var id: String { self.rawValue }

    var label: String {
        switch self {
        case .project: "Project"
        case .port: "Port"
        }
    }
}

enum DestructiveActionKind {
    case stopServer
    case freePort
    case stopTunnel
    case stopBlocker
    case killGroup

    var label: String {
        switch self {
        case .stopServer: "Stop server"
        case .freePort: "Free port"
        case .stopTunnel: "Stop tunnel"
        case .stopBlocker: "Stop blocker"
        case .killGroup: "Kill group"
        }
    }
}

struct ActiveListenerGroup: Identifiable, Hashable {
    let projectRoot: String
    let displayName: String
    let isWorktreeLike: Bool
    let toolLabel: String
    let processes: [TrackedProcessSnapshot]

    var id: String { "\(self.projectRoot)#\(self.toolLabel)" }
    var count: Int { self.processes.count }
    var pids: [Int] { self.processes.map(\.process.pid) }
}

struct DestructiveActionConfirmation {
    let kind: DestructiveActionKind
    let messageText: String
    let informativeText: String
    let confirmButtonTitle: String
}

enum DestructiveActionAdvisor {
    static func kind(for process: TrackedProcessSnapshot, portContext: Int?) -> DestructiveActionKind? {
        let command = process.process.commandLine
        let lowercasedCommand = command.lowercased()
        let tool = process.process.toolLabel.lowercased()

        if process.process.isNodeFamily, portContext != nil {
            return .stopServer
        }

        let listenerIsSSH = process.listeners.contains {
            $0.commandName.lowercased() == "ssh" || $0.commandName.lowercased() == "sshd"
        }
        if tool == "ssh" || tool == "sshd" || lowercasedCommand.hasPrefix("ssh ") || listenerIsSSH {
            return .stopTunnel
        }

        if DestructiveActionPolicy.canTerminate(process) {
            return portContext != nil ? .freePort : .stopBlocker
        }

        return nil
    }

    static func confirmation(for process: TrackedProcessSnapshot, portContext: Int?) -> DestructiveActionConfirmation? {
        guard let kind = self.kind(for: process, portContext: portContext) else { return nil }
        let pid = process.process.pid
        let target = process.process.toolLabel
        let portText = portContext.map { " on port \($0)" } ?? ""
        let command = process.process.commandLine

        switch kind {
        case .stopServer:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop server listening\(portText)?",
                informativeText: "Sends SIGTERM to \(target) (PID \(pid)) only. Other Node work stays untouched.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .freePort:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Free port\(portText) by stopping \(target)?",
                informativeText: "Sends SIGTERM to PID \(pid) only. Portpourri will not terminate unrelated listeners.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .stopTunnel:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop tunnel\(portText)?",
                informativeText: "Sends SIGTERM to the SSH process (PID \(pid)) and closes this tunnel only.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .stopBlocker:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop blocker \(target)?",
                informativeText: "Sends SIGTERM to PID \(pid) only.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .killGroup:
            return nil
        }
    }

    static func confirmation(for group: ActiveListenerGroup) -> DestructiveActionConfirmation {
        let ports = Set(group.processes.flatMap(\.ports)).sorted()
        let portList = ports.map(String.init).joined(separator: ", ")
        let portText = portList.isEmpty ? "active listeners" : "ports \(portList)"
        return DestructiveActionConfirmation(
            kind: .killGroup,
            messageText: "Kill \(group.toolLabel) group for \(group.displayName)?",
            informativeText: "Sends SIGTERM to \(group.count) active-listener process\(group.count == 1 ? "" : "es") in \(group.displayName) tied to \(portText) only. Other projects and unrelated Node processes are excluded.",
            confirmButtonTitle: DestructiveActionKind.killGroup.label
        )
    }
}

enum DestructiveActionPolicy {
    static func hasMeaningfulDirectory(_ process: TrackedProcessSnapshot) -> Bool {
        guard let cwd = process.process.cwd, cwd != "/" else { return false }
        return FileManager.default.fileExists(atPath: cwd)
    }

    static func canTerminate(_ process: TrackedProcessSnapshot) -> Bool {
        if process.process.isNodeFamily {
            return true
        }

        guard hasMeaningfulDirectory(process) else { return false }

        let command = process.process.commandLine
        if command.hasPrefix("/System/") || command.hasPrefix("/usr/") || command.hasPrefix("/Applications/") {
            return false
        }

        return true
    }

    static func sortedProcesses(_ processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        processes.sorted { lhs, rhs in
            let lhsPorts = lhs.ports.map(String.init).joined(separator: ",")
            let rhsPorts = rhs.ports.map(String.init).joined(separator: ",")
            if lhsPorts == rhsPorts {
                return lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel) == .orderedAscending
            }
            return lhsPorts.localizedStandardCompare(rhsPorts) == .orderedAscending
        }
    }
}

@MainActor
final class SettingsStore: ObservableObject {
    static let defaultWatchedPortsText = SnapshotService.defaultWatchedPorts.map(String.init).joined(separator: ",")

    var onChange: (() -> Void)?

    @Published var launchAtLogin: Bool {
        didSet {
            UserDefaults.standard.set(self.launchAtLogin, forKey: "launchAtLogin")
            self.onChange?()
        }
    }

    @Published var refreshCadence: RefreshCadence {
        didSet {
            UserDefaults.standard.set(self.refreshCadence.rawValue, forKey: "refreshCadence")
            self.onChange?()
        }
    }

    @Published var confirmBeforeTerminate: Bool {
        didSet {
            UserDefaults.standard.set(self.confirmBeforeTerminate, forKey: "confirmBeforeTerminate")
            self.onChange?()
        }
    }

    @Published var groupMode: GroupMode {
        didSet {
            UserDefaults.standard.set(self.groupMode.rawValue, forKey: "groupMode")
            self.onChange?()
        }
    }

    @Published var showNonNodeListeners: Bool {
        didSet {
            UserDefaults.standard.set(self.showNonNodeListeners, forKey: "showNonNodeListeners")
            self.onChange?()
        }
    }

    @Published var watchedPortsText: String {
        didSet {
            UserDefaults.standard.set(self.watchedPortsText, forKey: "watchedPortsText")
            self.onChange?()
        }
    }

    @Published var menuBarDisplayMode: MenuBarDisplayMode {
        didSet {
            UserDefaults.standard.set(self.menuBarDisplayMode.rawValue, forKey: "menuBarDisplayMode")
            self.onChange?()
        }
    }

    @Published var enableConflictNotifications: Bool {
        didSet {
            UserDefaults.standard.set(self.enableConflictNotifications, forKey: "enableConflictNotifications")
            self.onChange?()
        }
    }

    @Published var notificationSound: Bool {
        didSet {
            UserDefaults.standard.set(self.notificationSound, forKey: "notificationSound")
            self.onChange?()
        }
    }


    @Published var hideWhenIdle: Bool {
        didSet {
            UserDefaults.standard.set(self.hideWhenIdle, forKey: "hideWhenIdle")
            self.onChange?()
        }
    }

    @Published var showConflictBadge: Bool {
        didSet {
            UserDefaults.standard.set(self.showConflictBadge, forKey: "showConflictBadge")
            self.onChange?()
        }
    }

    @Published var hotkeyModifiers: String {
        didSet {
            UserDefaults.standard.set(self.hotkeyModifiers, forKey: "hotkeyModifiers")
            self.onChange?()
        }
    }

    @Published var hotkeyKey: String {
        didSet {
            UserDefaults.standard.set(self.hotkeyKey, forKey: "hotkeyKey")
            self.onChange?()
        }
    }

    @Published var portCommandTemplate: String {
        didSet {
            UserDefaults.standard.set(self.portCommandTemplate, forKey: "portCommandTemplate")
            self.onChange?()
        }
    }

    init() {
        let defaults = UserDefaults.standard
        self.launchAtLogin = defaults.object(forKey: "launchAtLogin") as? Bool ?? false
        let rawCadence = defaults.double(forKey: "refreshCadence")
        self.refreshCadence = RefreshCadence(rawValue: rawCadence == 0 ? 60 : rawCadence) ?? .oneMinute
        self.confirmBeforeTerminate = defaults.object(forKey: "confirmBeforeTerminate") as? Bool ?? true
        self.groupMode = GroupMode(rawValue: defaults.string(forKey: "groupMode") ?? GroupMode.project.rawValue) ?? .project
        self.showNonNodeListeners = defaults.object(forKey: "showNonNodeListeners") as? Bool ?? false
        self.watchedPortsText = defaults.string(forKey: "watchedPortsText") ?? Self.defaultWatchedPortsText
        self.menuBarDisplayMode = MenuBarDisplayMode(rawValue: defaults.string(forKey: "menuBarDisplayMode") ?? "") ?? .countAndMemory
        self.enableConflictNotifications = defaults.object(forKey: "enableConflictNotifications") as? Bool ?? true
        self.notificationSound = defaults.object(forKey: "notificationSound") as? Bool ?? true
        self.hideWhenIdle = defaults.object(forKey: "hideWhenIdle") as? Bool ?? false
        self.showConflictBadge = defaults.object(forKey: "showConflictBadge") as? Bool ?? true
        self.hotkeyModifiers = defaults.string(forKey: "hotkeyModifiers") ?? "ctrl+shift"
        self.hotkeyKey = defaults.string(forKey: "hotkeyKey") ?? "P"
        self.portCommandTemplate = defaults.string(forKey: "portCommandTemplate") ?? "PORT={port}"
    }

    var watchedPorts: [Int] {
        let ports = self.watchedPortsText
            .split(separator: ",")
            .compactMap { Int($0.trimmingCharacters(in: .whitespacesAndNewlines)) }
        return Array(Set(ports)).sorted()
    }
}

@MainActor
final class PortpourriStore: ObservableObject {
    @Published var snapshot: AppSnapshot
    @Published var aiSnapshot: AIToolSnapshot = .empty
    @Published var isRefreshing = false
    @Published var lastError: String?
    @Published var isPopoverPresented = false
    @Published var clipboardNotice: String?

    let settings = SettingsStore()
    let useSampleData: Bool

    private let snapshotService = SnapshotService()
    private let aiToolProbe = AIToolProbe()
    private let refreshCoordinator = SnapshotRefreshCoordinator()
    private var refreshTimer: Timer?
    private var refreshTask: Task<Void, Never>?
    private var aiRefreshTask: Task<Void, Never>?
    private var lastAIToolRefreshAt: Date?
    private var notificationTracker = ConflictNotificationTracker()

    init(useSampleData: Bool) {
        self.useSampleData = useSampleData
        self.snapshot = useSampleData
            ? SnapshotService.sampleSnapshot()
            : AppSnapshot.empty(watchedPorts: SnapshotService.defaultWatchedPorts)
        self.settings.onChange = { [weak self] in
            self?.settingsDidChange()
        }
    }

    func start() {
        self.applyLaunchAtLogin()
        self.scheduleRefreshTimer()
        self.refreshNow()
        self.refreshAITools(force: true)
    }

    func stop() {
        self.refreshTimer?.invalidate()
        self.refreshTimer = nil
        self.refreshTask?.cancel()
        self.refreshTask = nil
        self.aiRefreshTask?.cancel()
        self.aiRefreshTask = nil
    }

    func refreshNow() {
        let watchedPorts = self.settings.watchedPorts.isEmpty ? SnapshotService.defaultWatchedPorts : self.settings.watchedPorts
        let useSampleData = self.useSampleData
        let service = self.snapshotService

        self.isRefreshing = true
        self.lastError = nil

        self.refreshTask?.cancel()
        self.refreshTask = Task { @MainActor [weak self] in
            guard let self else { return }
            let generation = await self.refreshCoordinator.beginRefresh()
            let result = await Task.detached(priority: .userInitiated) {
                if useSampleData {
                    return Result<AppSnapshot, Error>.success(SnapshotService.sampleSnapshot(watchedPorts: watchedPorts))
                }
                return Result<AppSnapshot, Error> {
                    try service.captureLiveSnapshot(watchedPorts: watchedPorts)
                }
            }.value

            guard !Task.isCancelled else { return }
            guard await self.refreshCoordinator.shouldApplyResult(for: generation) else { return }

            self.isRefreshing = false
            switch result {
            case let .success(snapshot):
                self.snapshot = snapshot
                self.postNotificationsForNewConflicts(in: snapshot)
            case let .failure(error):
                self.lastError = error.localizedDescription
                self.snapshot = AppSnapshot.empty(watchedPorts: watchedPorts, source: "error")
            }
        }
    }

    func setPopoverPresented(_ presented: Bool) {
        self.isPopoverPresented = presented
        self.scheduleRefreshTimer()
        if presented {
            self.refreshNow()
            self.refreshAITools(force: true)
        }
    }

    func visibleOtherProcesses() -> [TrackedProcessSnapshot] {
        self.snapshot.otherProcesses.filter { process in
            self.settings.showNonNodeListeners || process.isWatchedConflict
        }
    }

    func copySnapshotJSON() {
        do {
            let data = try self.snapshotService.exportJSON(snapshot: self.snapshot)
            guard let json = String(data: data, encoding: .utf8) else { return }
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(json, forType: .string)
            self.clipboardNotice = "Snapshot JSON copied"
        } catch {
            self.lastError = error.localizedDescription
        }
    }

    func copyText(_ text: String, label: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        self.clipboardNotice = "\(label) copied"
    }

    func copySuggestedPort(after port: Int) {
        guard let suggestedPort = self.nextAvailablePort(after: port) else {
            self.lastError = "No free port found"
            return
        }
        let text = self.settings.portCommandTemplate
            .replacingOccurrences(of: "{port}", with: String(suggestedPort))
        self.copyText(text, label: "Command copied")
    }

    var activeListenerGroups: [ActiveListenerGroup] {
        self.snapshot.projects
            .flatMap { project -> [ActiveListenerGroup] in
                let listenerProcesses = project.processes.filter { !$0.listeners.isEmpty }
                let grouped = Dictionary(grouping: listenerProcesses, by: { $0.process.toolLabel })
                return grouped.map { toolLabel, processes in
                    ActiveListenerGroup(
                        projectRoot: project.projectRoot,
                        displayName: project.displayName,
                        isWorktreeLike: project.isWorktreeLike,
                        toolLabel: toolLabel,
                        processes: DestructiveActionPolicy.sortedProcesses(processes)
                    )
                }
            }
            .sorted {
                if $0.count == $1.count {
                    if $0.displayName == $1.displayName {
                        return $0.toolLabel.localizedCaseInsensitiveCompare($1.toolLabel) == .orderedAscending
                    }
                    return $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedAscending
                }
                return $0.count > $1.count
            }
    }

    func terminateGroup(_ group: ActiveListenerGroup) {
        if self.settings.confirmBeforeTerminate {
            let confirmation = DestructiveActionAdvisor.confirmation(for: group)
            let alert = NSAlert()
            alert.messageText = confirmation.messageText
            alert.informativeText = confirmation.informativeText
            alert.addButton(withTitle: confirmation.confirmButtonTitle)
            alert.addButton(withTitle: "Cancel")
            if alert.runModal() != .alertFirstButtonReturn {
                return
            }
        }

        for pid in group.pids {
            kill(pid_t(pid), SIGTERM)
        }
        self.refreshNow()
    }

    func reveal(path: String?) {
        guard let path else { return }
        NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: path)])
    }

    func openApplication(at path: String) {
        NSWorkspace.shared.open(URL(fileURLWithPath: path))
    }

    func openTerminal(path: String?) {
        guard let path else { return }
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
        process.arguments = ["-a", "Terminal", path]
        try? process.run()
    }

    func terminate(process: TrackedProcessSnapshot, portContext: Int? = nil) {
        if self.settings.confirmBeforeTerminate {
            let confirmation = DestructiveActionAdvisor.confirmation(for: process, portContext: portContext)
            let alert = NSAlert()
            alert.messageText = confirmation?.messageText ?? "Terminate process \(process.process.pid)?"
            alert.informativeText = confirmation?.informativeText ?? process.process.commandLine
            alert.addButton(withTitle: confirmation?.confirmButtonTitle ?? "Terminate")
            alert.addButton(withTitle: "Cancel")
            if alert.runModal() != .alertFirstButtonReturn {
                return
            }
        }

        if kill(pid_t(process.process.pid), SIGTERM) == 0 {
            self.refreshNow()
        } else {
            self.lastError = "Failed to terminate PID \(process.process.pid)"
        }
    }

    func nextAvailablePort(after port: Int) -> Int? {
        let occupiedPorts = Set(self.snapshot.allProcesses.flatMap(\.ports))
        let lowerBound = max(port + 1, 1024)

        if lowerBound <= 65_535 {
            for candidate in lowerBound...65_535 where !occupiedPorts.contains(candidate) {
                return candidate
            }
        }

        let upperFallback = min(max(port, 1024), 65_535)
        if upperFallback > 1024 {
            for candidate in 1024..<upperFallback where !occupiedPorts.contains(candidate) {
                return candidate
            }
        }

        return nil
    }

    private func postNotificationsForNewConflicts(in snapshot: AppSnapshot) {
        guard self.settings.enableConflictNotifications else { return }
        guard Bundle.main.bundleIdentifier != nil else { return }

        let newConflicts = self.notificationTracker.newExternalConflicts(in: snapshot.watchedPorts)

        for conflict in newConflicts {
            let suggested = self.nextAvailablePort(after: conflict.port)
            let body = suggested != nil
                ? "\(conflict.ownerSummary) \u{2014} use port \(suggested!) instead"
                : "\(conflict.ownerSummary) is blocking this port"

            let content = UNMutableNotificationContent()
            content.title = "Port \(conflict.port) blocked"
            content.body = body
            content.sound = self.settings.notificationSound ? .default : nil
            content.userInfo = ["port": conflict.port, "suggestedPort": suggested ?? 0]
            content.categoryIdentifier = "PORT_CONFLICT"

            let request = UNNotificationRequest(
                identifier: "conflict-\(conflict.port)",
                content: content,
                trigger: nil
            )
            UNUserNotificationCenter.current().add(request)
        }
    }

    private func settingsDidChange() {
        self.applyLaunchAtLogin()
        self.scheduleRefreshTimer()
        self.refreshNow()
    }

    private func refreshAITools(force: Bool = false) {
        let refreshInterval: TimeInterval = 300
        if !force,
           let lastAIToolRefreshAt,
           Date().timeIntervalSince(lastAIToolRefreshAt) < refreshInterval {
            return
        }

        self.aiRefreshTask?.cancel()
        let aiProbe = self.aiToolProbe
        let useSampleData = self.useSampleData

        self.aiRefreshTask = Task { @MainActor [weak self] in
            let result = await Task.detached(priority: .utility) {
                if useSampleData {
                    return Result<AIToolSnapshot, Error>.success(.empty)
                }
                return Result<AIToolSnapshot, Error> {
                    try aiProbe.scan()
                }
            }.value

            guard let self, !Task.isCancelled else { return }
            if case let .success(aiSnap) = result {
                self.aiSnapshot = aiSnap
                self.lastAIToolRefreshAt = Date()
            }
        }
    }

    private func scheduleRefreshTimer() {
        self.refreshTimer?.invalidate()
        let interval = self.isPopoverPresented ? 2.0 : self.settings.refreshCadence.rawValue
        self.refreshTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.refreshNow()
            }
        }
    }

    private func applyLaunchAtLogin() {
        do {
            try LaunchAtLoginManager.apply(enabled: self.settings.launchAtLogin)
        } catch {
            self.lastError = error.localizedDescription
        }
    }
}

enum LaunchAtLoginError: Error, LocalizedError {
    case unavailableOutsideAppBundle

    var errorDescription: String? {
        switch self {
        case .unavailableOutsideAppBundle:
            "Launch at login only works from a packaged app bundle."
        }
    }
}

enum LaunchAtLoginManager {
    static func apply(enabled: Bool) throws {
        guard Bundle.main.bundleURL.pathExtension == "app" else {
            if !enabled { return }
            throw LaunchAtLoginError.unavailableOutsideAppBundle
        }

        if enabled {
            try SMAppService.mainApp.register()
        } else {
            try SMAppService.mainApp.unregister()
        }
    }
}
