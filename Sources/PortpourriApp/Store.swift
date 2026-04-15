import AppKit
import Darwin
import Foundation
import PortpourriCore
import UserNotifications

@MainActor
final class PortpourriStore: ObservableObject {
    @Published var snapshot: AppSnapshot
    @Published var aiSnapshot: AIToolSnapshot = .empty
    @Published var isRefreshing = false
    @Published private(set) var actionIssue: AppIssue?
    @Published private(set) var refreshIssue: AppIssue?
    @Published private(set) var diagnosticsReport: SnapshotDoctorReport?
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
    private var diagnosticsTask: Task<Void, Never>?
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
        self.refreshDiagnostics()
        self.refreshAITools(force: true)
    }

    func stop() {
        self.refreshTimer?.invalidate()
        self.refreshTimer = nil
        self.refreshTask?.cancel()
        self.refreshTask = nil
        self.aiRefreshTask?.cancel()
        self.aiRefreshTask = nil
        self.diagnosticsTask?.cancel()
        self.diagnosticsTask = nil
    }

    func refreshNow() {
        let watchedPorts = self.currentWatchedPorts
        let useSampleData = self.useSampleData
        let service = self.snapshotService

        self.isRefreshing = true
        self.refreshIssue = nil

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
                self.refreshIssue = AppDiagnostics.issue(for: error)
                self.snapshot = AppSnapshot.empty(watchedPorts: watchedPorts, source: "error")
                self.refreshDiagnostics()
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
        self.actionIssue = nil
        do {
            let data = try self.snapshotService.exportJSON(snapshot: self.snapshot)
            guard let json = String(data: data, encoding: .utf8) else { return }
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(json, forType: .string)
            self.clipboardNotice = "Snapshot JSON copied"
        } catch {
            self.actionIssue = AppDiagnostics.issue(for: error)
        }
    }

    func copyText(_ text: String, label: String) {
        self.actionIssue = nil
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        self.clipboardNotice = "\(label) copied"
    }

    func copySuggestedPort(after port: Int) {
        guard let suggestedPort = self.nextAvailablePort(after: port) else {
            self.actionIssue = AppIssue(
                severity: .warning,
                title: "No free port was available.",
                recoverySuggestion: "Try removing a stale listener or expand the watched-port range in Settings.",
                detail: nil
            )
            return
        }
        let text = self.settings.resolvedPortCommandTemplate
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
        self.actionIssue = nil
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
        self.actionIssue = nil
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
            self.actionIssue = AppIssue(
                severity: .error,
                title: "Portpourri could not stop PID \(process.process.pid).",
                recoverySuggestion: "The process may already be gone or protected by macOS. Retry once the process state settles.",
                detail: process.process.commandLine
            )
        }
    }

    func refreshDiagnostics() {
        guard !self.useSampleData else {
            self.diagnosticsReport = nil
            return
        }

        let service = self.snapshotService
        let watchedPorts = self.currentWatchedPorts

        self.diagnosticsTask?.cancel()
        self.diagnosticsTask = Task { @MainActor [weak self] in
            let report = await Task.detached(priority: .utility) {
                service.captureDoctorReport(watchedPorts: watchedPorts)
            }.value

            guard let self, !Task.isCancelled else { return }
            self.diagnosticsReport = report
        }
    }

    var currentIssue: AppIssue? {
        self.actionIssue ?? self.refreshIssue ?? AppDiagnostics.issue(from: self.diagnosticsReport)
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
        self.refreshDiagnostics()
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
        self.actionIssue = nil
        do {
            try LaunchAtLoginManager.apply(enabled: self.settings.launchAtLogin)
        } catch {
            self.actionIssue = AppDiagnostics.issue(for: error)
        }
    }

    private var currentWatchedPorts: [Int] {
        self.settings.watchedPorts.isEmpty ? SnapshotService.defaultWatchedPorts : self.settings.watchedPorts
    }
}
