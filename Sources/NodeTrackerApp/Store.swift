import AppKit
import Darwin
import Foundation
import NodeTrackerCore
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
    case dotMatrix
    case countAndMemory
    case countOnly
    case memoryOnly
    case iconOnly

    var id: String { self.rawValue }

    var label: String {
        switch self {
        case .dotMatrix: "Dot Matrix"
        case .countAndMemory: "Projects + Memory"
        case .countOnly: "Project Count"
        case .memoryOnly: "Memory Usage"
        case .iconOnly: "Icon Only"
        }
    }

    var description: String {
        switch self {
        case .dotMatrix: "\u{25CF}\u{25CF}\u{25CF}  \u{25A0}\u{25A0}\u{25A1}"
        case .countAndMemory: "3 \u{00B7} 2.1G"
        case .countOnly: "3"
        case .memoryOnly: "2.1G"
        case .iconOnly: "N"
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

struct WatchedPortPreset: Identifiable, Hashable {
    let id: String
    let title: String
    let detail: String
    let ports: [Int]
    let isRecommended: Bool
}

@MainActor
final class SettingsStore: ObservableObject {
    static let watchedPortPresets: [WatchedPortPreset] = [
        WatchedPortPreset(
            id: "frontend",
            title: "Frontend dev servers",
            detail: "React, Next, Vite and similar local apps",
            ports: [3000, 3001, 5173],
            isRecommended: true
        ),
        WatchedPortPreset(
            id: "storybook",
            title: "Storybook",
            detail: "Component playgrounds",
            ports: [6006],
            isRecommended: true
        ),
        WatchedPortPreset(
            id: "backend",
            title: "Backend APIs",
            detail: "Common local API ports",
            ports: [8080, 8081],
            isRecommended: true
        ),
        WatchedPortPreset(
            id: "debugger",
            title: "Node inspector",
            detail: "Debugger and attach workflows",
            ports: [9229],
            isRecommended: false
        ),
        WatchedPortPreset(
            id: "python",
            title: "Python and Flask",
            detail: "Optional local servers like port 5000",
            ports: [5000],
            isRecommended: false
        ),
        WatchedPortPreset(
            id: "data",
            title: "Datastores",
            detail: "Postgres and Redis defaults",
            ports: [5432, 5433, 6379],
            isRecommended: false
        ),
    ]

    static let recommendedWatchedPorts = watchedPortPresets
        .filter(\.isRecommended)
        .flatMap(\.ports)
        .sorted()

    static let defaultWatchedPortsText = recommendedWatchedPorts.map(String.init).joined(separator: ",")

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

    @Published var hasCompletedPortOnboarding: Bool {
        didSet {
            UserDefaults.standard.set(self.hasCompletedPortOnboarding, forKey: "hasCompletedPortOnboarding")
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

    @Published var checkForUpdatesAutomatically: Bool {
        didSet {
            UserDefaults.standard.set(self.checkForUpdatesAutomatically, forKey: "checkForUpdatesAutomatically")
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
        let storedWatchedPortsText = defaults.string(forKey: "watchedPortsText")
        self.launchAtLogin = defaults.object(forKey: "launchAtLogin") as? Bool ?? false
        let rawCadence = defaults.double(forKey: "refreshCadence")
        self.refreshCadence = RefreshCadence(rawValue: rawCadence == 0 ? 60 : rawCadence) ?? .oneMinute
        self.confirmBeforeTerminate = defaults.object(forKey: "confirmBeforeTerminate") as? Bool ?? true
        self.groupMode = GroupMode(rawValue: defaults.string(forKey: "groupMode") ?? GroupMode.project.rawValue) ?? .project
        self.showNonNodeListeners = defaults.object(forKey: "showNonNodeListeners") as? Bool ?? false
        self.watchedPortsText = storedWatchedPortsText ?? Self.defaultWatchedPortsText
        self.hasCompletedPortOnboarding = defaults.object(forKey: "hasCompletedPortOnboarding") as? Bool ?? (storedWatchedPortsText != nil)
        self.menuBarDisplayMode = MenuBarDisplayMode(rawValue: defaults.string(forKey: "menuBarDisplayMode") ?? "") ?? .countAndMemory
        self.enableConflictNotifications = defaults.object(forKey: "enableConflictNotifications") as? Bool ?? true
        self.notificationSound = defaults.object(forKey: "notificationSound") as? Bool ?? true
        self.checkForUpdatesAutomatically = defaults.object(forKey: "checkForUpdatesAutomatically") as? Bool ?? true
        self.hideWhenIdle = defaults.object(forKey: "hideWhenIdle") as? Bool ?? false
        self.showConflictBadge = defaults.object(forKey: "showConflictBadge") as? Bool ?? true
        self.hotkeyModifiers = defaults.string(forKey: "hotkeyModifiers") ?? "ctrl+shift"
        self.hotkeyKey = defaults.string(forKey: "hotkeyKey") ?? "P"
        self.portCommandTemplate = defaults.string(forKey: "portCommandTemplate") ?? "PORT={port}"
    }

    var watchedPorts: [Int] {
        Self.parsePorts(from: self.watchedPortsText)
    }

    func includesPreset(_ preset: WatchedPortPreset) -> Bool {
        let watched = Set(self.watchedPorts)
        return preset.ports.allSatisfy { watched.contains($0) }
    }

    func setPreset(_ preset: WatchedPortPreset, enabled: Bool) {
        var updated = Set(self.watchedPorts)
        if enabled {
            updated.formUnion(preset.ports)
        } else {
            updated.subtract(preset.ports)
        }
        self.watchedPortsText = updated.sorted().map(String.init).joined(separator: ",")
    }

    func completePortOnboarding() {
        self.hasCompletedPortOnboarding = true
        self.onChange?()
    }

    private static func parsePorts(from text: String) -> [Int] {
        let ports = text
            .split(separator: ",")
            .compactMap { Int($0.trimmingCharacters(in: .whitespacesAndNewlines)) }
        return Array(Set(ports)).sorted()
    }
}

@MainActor
final class NodeTrackerStore: ObservableObject {
    @Published var snapshot: AppSnapshot
    @Published var isRefreshing = false
    @Published var lastError: String?
    @Published var isPopoverPresented = false
    @Published var clipboardNotice: String?

    let settings: SettingsStore
    let useSampleData: Bool

    private let snapshotService = SnapshotService()
    private let aiToolProbe = AIToolProbe()
    private var refreshTimer: Timer?
    private var previousConflictPorts: Set<Int> = []
    private var cachedAITools: AIToolSnapshot = .empty
    private var aiToolScanTask: Task<Void, Never>?

    init(useSampleData: Bool) {
        let settings = SettingsStore()
        self.settings = settings
        self.useSampleData = useSampleData
        let initialSnapshot = useSampleData
            ? SnapshotService.sampleSnapshot(watchedPorts: settings.watchedPorts)
            : AppSnapshot.empty(watchedPorts: settings.watchedPorts)
        self.snapshot = initialSnapshot
        if useSampleData {
            self.cachedAITools = initialSnapshot.aiTools
        }
        self.settings.onChange = { [weak self] in
            self?.settingsDidChange()
        }
    }

    func start() {
        self.applyLaunchAtLogin()
        self.scheduleRefreshTimer()
        self.refreshNow()
        self.refreshAIToolsInBackground()
    }

    func stop() {
        self.refreshTimer?.invalidate()
        self.refreshTimer = nil
    }

    func refreshNow() {
        let watchedPorts = self.settings.watchedPorts
        let useSampleData = self.useSampleData
        let service = self.snapshotService

        self.isRefreshing = true
        self.lastError = nil

        Task {
            let result = await Task.detached(priority: .userInitiated) {
                if useSampleData {
                    return Result<AppSnapshot, Error>.success(SnapshotService.sampleSnapshot(watchedPorts: watchedPorts))
                }
                return Result<AppSnapshot, Error> {
                    try service.captureLiveSnapshot(watchedPorts: watchedPorts)
                }
            }.value

            self.isRefreshing = false
            switch result {
            case var .success(snapshot):
                snapshot = snapshot.withAITools(self.cachedAITools)
                self.snapshot = snapshot
                self.checkForNewConflicts(in: snapshot)
            case let .failure(error):
                self.lastError = error.localizedDescription
                self.snapshot = AppSnapshot.empty(watchedPorts: watchedPorts, source: "error")
            }
        }
    }

    private func refreshAIToolsInBackground() {
        self.aiToolScanTask?.cancel()
        let probe = self.aiToolProbe
        self.aiToolScanTask = Task {
            let result = await Task.detached(priority: .utility) {
                try? probe.scan()
            }.value
            guard !Task.isCancelled, let aiTools = result else { return }
            self.cachedAITools = aiTools
            self.snapshot = self.snapshot.withAITools(aiTools)
        }
    }

    func setPopoverPresented(_ presented: Bool) {
        self.isPopoverPresented = presented
        self.scheduleRefreshTimer()
        if presented {
            self.refreshNow()
            self.refreshAIToolsInBackground()
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


    func terminateAllNodeProcessesOnWatchedPorts() {
        let watchedPortSet = Set(self.snapshot.watchedPorts.filter(\.isBusy).map(\.port))
        let nodeProcesses = self.snapshot.projects
            .flatMap(\.processes)
            .filter { process in
                process.process.isNodeFamily && !Set(process.ports).isDisjoint(with: watchedPortSet)
            }

        guard !nodeProcesses.isEmpty else { return }

        if self.settings.confirmBeforeTerminate {
            let alert = NSAlert()
            alert.messageText = "Terminate \(nodeProcesses.count) Node process\(nodeProcesses.count == 1 ? "" : "es")?"
            alert.informativeText = "This will free all watched ports owned by Node apps."
            alert.addButton(withTitle: "Terminate All")
            alert.addButton(withTitle: "Cancel")
            if alert.runModal() != .alertFirstButtonReturn {
                return
            }
        }

        for process in nodeProcesses {
            kill(pid_t(process.process.pid), SIGTERM)
        }
        self.refreshNow()
    }

    func terminateGroup(_ group: NodeProcessGroup) {
        if self.settings.confirmBeforeTerminate {
            let alert = NSAlert()
            alert.messageText = "Terminate \(group.count) \(group.toolLabel) process\(group.count == 1 ? "" : "es")?"
            alert.informativeText = "This will free \(group.formattedMemory) of memory."
            alert.addButton(withTitle: "Terminate All")
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

    // MARK: - AI Tool Actions

    func revealWorktree(_ entry: AIWorktreeEntry) {
        NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: entry.path)])
    }

    func deleteWorktree(_ entry: AIWorktreeEntry) {
        let alert = NSAlert()
        alert.messageText = "Delete worktree \"\(entry.name)\"?"
        alert.informativeText = "\(entry.formattedSize) at \(entry.path)"
        alert.addButton(withTitle: "Delete")
        alert.addButton(withTitle: "Cancel")
        alert.alertStyle = .warning
        guard alert.runModal() == .alertFirstButtonReturn else { return }

        do {
            try FileManager.default.removeItem(atPath: entry.path)
            self.refreshNow()
        } catch {
            self.lastError = "Failed to delete: \(error.localizedDescription)"
        }
    }

    func deleteAllWorktrees(_ entries: [AIWorktreeEntry]) {
        guard !entries.isEmpty else { return }
        let totalSize = entries.reduce(Int64(0)) { $0 + $1.sizeBytes }
        let mb = Double(totalSize) / (1024 * 1024)
        let formattedSize = mb >= 1024 ? String(format: "%.1f GB", mb / 1024) : String(format: "%.0f MB", mb)

        let alert = NSAlert()
        alert.messageText = "Delete \(entries.count) worktree\(entries.count == 1 ? "" : "s")?"
        alert.informativeText = "This will free \(formattedSize)."
        alert.addButton(withTitle: "Delete All")
        alert.addButton(withTitle: "Cancel")
        alert.alertStyle = .warning
        guard alert.runModal() == .alertFirstButtonReturn else { return }

        var failCount = 0
        for entry in entries {
            do {
                try FileManager.default.removeItem(atPath: entry.path)
            } catch {
                failCount += 1
            }
        }
        if failCount > 0 {
            self.lastError = "Failed to delete \(failCount) worktree\(failCount == 1 ? "" : "s")"
        }
        self.refreshNow()
    }

    func terminate(process: TrackedProcessSnapshot) {
        if self.settings.confirmBeforeTerminate {
            let alert = NSAlert()
            alert.messageText = "Terminate process \(process.process.pid)?"
            alert.informativeText = process.process.commandLine
            alert.addButton(withTitle: "Terminate")
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

    private func checkForNewConflicts(in snapshot: AppSnapshot) {
        let currentConflicts = Set(snapshot.watchedPorts.filter(\.isConflict).map(\.port))
        let newConflicts = currentConflicts.subtracting(self.previousConflictPorts)
        self.previousConflictPorts = currentConflicts

        guard self.settings.enableConflictNotifications else { return }
        guard Bundle.main.bundleIdentifier != nil else { return }

        for port in newConflicts.sorted() {
            guard let status = snapshot.watchedPorts.first(where: { $0.port == port }) else { continue }
            let owner = status.ownerSummary
            let suggested = self.nextAvailablePort(after: port)
            let body = suggested != nil
                ? "\(owner) \u{2014} use port \(suggested!) instead"
                : "\(owner) is blocking this port"

            let content = UNMutableNotificationContent()
            content.title = "Port \(port) blocked"
            content.body = body
            content.sound = self.settings.notificationSound ? .default : nil
            content.userInfo = ["port": port, "suggestedPort": suggested ?? 0]

            let request = UNNotificationRequest(
                identifier: "conflict-\(port)",
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
