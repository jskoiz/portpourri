import AppKit
import Darwin
import Foundation
import NodeTrackerCore
import ServiceManagement
import UserNotifications

enum RefreshCadence: Double, CaseIterable, Identifiable {
    case fiveSeconds = 5
    case tenSeconds = 10
    case thirtySeconds = 30
    case sixtySeconds = 60

    var id: Double { self.rawValue }

    var label: String {
        switch self {
        case .fiveSeconds: "5 sec"
        case .tenSeconds: "10 sec"
        case .thirtySeconds: "30 sec"
        case .sixtySeconds: "60 sec"
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

    init() {
        let defaults = UserDefaults.standard
        self.launchAtLogin = defaults.object(forKey: "launchAtLogin") as? Bool ?? false
        let rawCadence = defaults.double(forKey: "refreshCadence")
        self.refreshCadence = RefreshCadence(rawValue: rawCadence == 0 ? 10 : rawCadence) ?? .tenSeconds
        self.confirmBeforeTerminate = defaults.object(forKey: "confirmBeforeTerminate") as? Bool ?? true
        self.groupMode = GroupMode(rawValue: defaults.string(forKey: "groupMode") ?? GroupMode.project.rawValue) ?? .project
        self.showNonNodeListeners = defaults.object(forKey: "showNonNodeListeners") as? Bool ?? false
        self.watchedPortsText = defaults.string(forKey: "watchedPortsText") ?? Self.defaultWatchedPortsText
    }

    var watchedPorts: [Int] {
        let ports = self.watchedPortsText
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

    let settings = SettingsStore()
    let useSampleData: Bool

    private let snapshotService = SnapshotService()
    private var refreshTimer: Timer?
    private var previousConflictPorts: Set<Int> = []

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
    }

    func stop() {
        self.refreshTimer?.invalidate()
        self.refreshTimer = nil
    }

    func refreshNow() {
        let watchedPorts = self.settings.watchedPorts.isEmpty ? SnapshotService.defaultWatchedPorts : self.settings.watchedPorts
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

            await MainActor.run {
                self.isRefreshing = false
                switch result {
                case let .success(snapshot):
                    self.snapshot = snapshot
                    self.checkForNewConflicts(in: snapshot)
                case let .failure(error):
                    self.lastError = error.localizedDescription
                    self.snapshot = AppSnapshot.empty(watchedPorts: watchedPorts, source: "error")
                }
            }
        }
    }

    func setPopoverPresented(_ presented: Bool) {
        self.isPopoverPresented = presented
        self.scheduleRefreshTimer()
        if presented {
            self.refreshNow()
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
        self.copyText(String(suggestedPort), label: "Suggested port")
    }

    func copyAllSuggestedPorts() {
        let conflictPorts = self.snapshot.watchedPorts.filter(\.isConflict)
        let suggestions = conflictPorts.compactMap { status -> String? in
            guard let port = self.nextAvailablePort(after: status.port) else { return nil }
            return "\(status.port)\u{2192}\(port)"
        }
        guard !suggestions.isEmpty else {
            self.lastError = "No free ports found"
            return
        }
        let text = suggestions.joined(separator: ", ")
        self.copyText(text, label: "All suggested ports")
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
            content.sound = .default
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
