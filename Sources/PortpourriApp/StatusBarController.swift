import AppKit
import Combine
import PortpourriCore
import SwiftUI
import UserNotifications

@MainActor
final class StatusBarController: NSObject, NSPopoverDelegate {
    private let store: PortpourriStore
    private let statusItem: NSStatusItem
    private let popover = NSPopover()
    private var settingsWindow: NSWindow?
    private var cancellables: Set<AnyCancellable> = []
    private var localEventMonitor: Any?
    private var globalEventMonitor: Any?
    private var hotkeyMonitor: Any?
    private var localHotkeyMonitor: Any?

    init(store: PortpourriStore) {
        self.store = store
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        super.init()
        self.configureStatusItem()
        self.configurePopover()
        self.installOutsideClickMonitors()
        self.installGlobalHotkey()
        self.configureNotifications()
        self.observeStore()
        self.updateStatusImage()
    }

    func openSettings() {
        if let existing = self.settingsWindow, existing.isVisible {
            self.applyAppearancePreference()
            existing.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let settingsView = SettingsRootView(store: self.store)
        let hostingController = NSHostingController(rootView: settingsView)

        let window = NSWindow(contentViewController: hostingController)
        window.title = "Portpourri Settings"
        window.styleMask = [.titled, .closable]
        window.center()
        window.isReleasedWhenClosed = false
        window.level = .floating

        self.settingsWindow = window
        self.applyAppearancePreference()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func quit() {
        NSApp.terminate(nil)
    }

    private func configureStatusItem() {
        guard let button = self.statusItem.button else { return }
        button.imagePosition = .imageOnly
        button.action = #selector(self.togglePopover(_:))
        button.target = self
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        self.updateTooltip()
    }

    private func configurePopover() {
        self.popover.behavior = .semitransient
        self.popover.delegate = self
        self.popover.animates = true
        self.popover.contentSize = NSSize(width: LayoutMetrics.popoverWidth, height: 100)
        let rootView = PopoverRootView(store: self.store)
        let hostingController = NSHostingController(rootView: rootView)
        // Let the view size itself; cap at a max height
        hostingController.sizingOptions = [.preferredContentSize]
        self.popover.contentViewController = hostingController
        self.applyAppearancePreference()
    }

    private func installOutsideClickMonitors() {
        self.localEventMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .otherMouseDown, .keyDown]) { [weak self] event in
            guard let self, self.popover.isShown else { return event }
            if event.type == .keyDown, event.keyCode == 53 {
                self.closePopover()
                return nil
            }
            if self.shouldClosePopover(for: event) {
                self.closePopover()
            }
            return event
        }

        self.globalEventMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .otherMouseDown]) { [weak self] _ in
            guard let self, self.popover.isShown else { return }
            self.closePopover()
        }
    }

    private func installGlobalHotkey() {
        self.reinstallHotkey()
    }

    func reinstallHotkey() {
        // Remove old monitors
        if let monitor = self.hotkeyMonitor {
            NSEvent.removeMonitor(monitor)
            self.hotkeyMonitor = nil
        }
        if let monitor = self.localHotkeyMonitor {
            NSEvent.removeMonitor(monitor)
            self.localHotkeyMonitor = nil
        }

        let requiredModifiers = self.store.settings.hotkeyModifiers.eventFlags
        let requiredKey = self.store.settings.hotkeyKey.eventKey

        guard !requiredKey.isEmpty, !requiredModifiers.isEmpty else { return }

        self.hotkeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard event.modifierFlags.contains(requiredModifiers),
                  event.charactersIgnoringModifiers?.lowercased() == requiredKey else { return }
            Task { @MainActor in
                self?.togglePopoverFromHotkey()
            }
        }

        self.localHotkeyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard event.modifierFlags.contains(requiredModifiers),
                  event.charactersIgnoringModifiers?.lowercased() == requiredKey else { return event }
            Task { @MainActor in
                self?.togglePopoverFromHotkey()
            }
            return nil
        }

        self.updateTooltip()
    }

    private func updateTooltip() {
        let symbolStr = self.store.settings.hotkeyDisplay
        let summary = self.store.snapshot.summary
        var parts: [String] = []
        if summary.nodeProjectCount > 0 {
            parts.append("\(summary.nodeProjectCount) project\(summary.nodeProjectCount == 1 ? "" : "s")")
        }
        if summary.watchedBusyCount > 0 {
            parts.append("\(summary.watchedBusyCount) watched port\(summary.watchedBusyCount == 1 ? "" : "s") busy")
        }
        if summary.watchedNonNodeConflictCount > 0 {
            parts.append("\(summary.watchedNonNodeConflictCount) conflict\(summary.watchedNonNodeConflictCount == 1 ? "" : "s")")
        }
        let status = parts.isEmpty ? "Idle" : parts.joined(separator: " \u{00B7} ")
        self.statusItem.button?.toolTip = "\(status) (\(symbolStr))"
    }

    private func configureNotifications() {
        guard Bundle.main.bundleIdentifier != nil else { return }
        UNUserNotificationCenter.current().delegate = self

        let copyAction = UNNotificationAction(
            identifier: "COPY_PORT",
            title: "Copy suggested port"
        )
        let category = UNNotificationCategory(
            identifier: "PORT_CONFLICT",
            actions: [copyAction],
            intentIdentifiers: []
        )
        UNUserNotificationCenter.current().setNotificationCategories([category])
    }

    private func observeStore() {
        self.store.$snapshot
            .sink { [weak self] _ in
                self?.updateStatusImage()
            }
            .store(in: &self.cancellables)

        self.store.settings.$menuBarDisplayMode
            .sink { [weak self] _ in
                self?.updateStatusImage()
            }
            .store(in: &self.cancellables)

        self.store.settings.$hideWhenIdle
            .sink { [weak self] _ in
                self?.updateStatusImage()
            }
            .store(in: &self.cancellables)

        self.store.settings.$showConflictBadge
            .sink { [weak self] _ in
                self?.updateStatusImage()
            }
            .store(in: &self.cancellables)

        self.store.settings.$appearanceMode
            .sink { [weak self] _ in
                self?.applyAppearancePreference()
            }
            .store(in: &self.cancellables)

        self.store.settings.$hotkeyKey
            .sink { [weak self] _ in
                self?.reinstallHotkey()
            }
            .store(in: &self.cancellables)

        self.store.settings.$hotkeyModifiers
            .sink { [weak self] _ in
                self?.reinstallHotkey()
            }
            .store(in: &self.cancellables)
    }

    private func applyAppearancePreference() {
        let appearance = self.store.settings.appearanceMode.nsAppearanceName.flatMap(NSAppearance.init(named:))

        NSApp.appearance = appearance
        self.popover.appearance = appearance
        self.popover.contentViewController?.view.appearance = appearance
        self.settingsWindow?.appearance = appearance
        self.settingsWindow?.contentViewController?.view.appearance = appearance
    }

    private func updateStatusImage() {
        let summary = self.store.snapshot.summary
        let isIdle = summary.nodeProjectCount == 0 && summary.watchedBusyCount == 0

        self.updateTooltip()

        // Hide the status item entirely when idle if the user opted in
        if self.store.settings.hideWhenIdle && isIdle && !self.popover.isShown {
            self.statusItem.isVisible = false
            return
        }
        self.statusItem.isVisible = true

        guard let button = self.statusItem.button else { return }

        let conflicts = summary.watchedNonNodeConflictCount
        let hasConflicts = conflicts > 0
        let showBadge = self.store.settings.showConflictBadge
        let displayMode = self.store.settings.menuBarDisplayMode

        if displayMode == .dotMatrix {
            let watchedPorts = Array(self.store.snapshot.watchedPorts.sorted(by: { $0.port < $1.port }).prefix(5))
            let projectCount = min(summary.nodeProjectCount, 5)
            if hasConflicts && showBadge {
                let buttonAppearance = button.effectiveAppearance
                let image = StatusChipRenderer.dotMatrixImageWithBadge(
                    watchedPorts: watchedPorts,
                    projectCount: projectCount,
                    conflicts: conflicts,
                    buttonAppearance: buttonAppearance
                )
                image.isTemplate = false
                button.image = image
            } else {
                let image = StatusChipRenderer.dotMatrixTemplateImage(
                    watchedPorts: watchedPorts,
                    projectCount: projectCount
                )
                image.isTemplate = true
                button.image = image
            }
            return
        }

        // Build the status text based on display mode
        let statusText = StatusChipRenderer.statusText(for: summary, displayMode: displayMode)

        // When there are conflicts and badge is enabled, use a non-template image with a badge
        if hasConflicts && showBadge {
            let buttonAppearance = button.effectiveAppearance
            let image = StatusChipRenderer.imageWithBadge(
                text: statusText,
                conflicts: conflicts,
                summary: summary,
                buttonAppearance: buttonAppearance
            )
            image.isTemplate = false
            button.image = image
        } else {
            // No conflicts or badge disabled: template image for auto light/dark
            let image = StatusChipRenderer.templateImage(text: statusText, summary: summary)
            image.isTemplate = true
            button.image = image
        }
    }

    @objc private func togglePopover(_ sender: AnyObject?) {
        guard let button = self.statusItem.button else { return }
        guard let event = NSApp.currentEvent else {
            self.closePopover()
            return
        }

        if event.type == .rightMouseUp {
            self.closePopover()
            self.showContextMenu(from: button, event: event)
            return
        }

        if self.popover.isShown {
            self.closePopover()
        } else {
            self.showPopover()
        }
    }

    private func togglePopoverFromHotkey() {
        if self.popover.isShown {
            self.closePopover()
        } else {
            self.showPopover()
        }
    }

    private func showPopover() {
        guard let button = self.statusItem.button else { return }
        NSApp.activate(ignoringOtherApps: true)
        self.popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        self.store.setPopoverPresented(true)
    }

    func popoverDidClose(_ notification: Notification) {
        self.store.setPopoverPresented(false)
    }

    private func closePopover() {
        guard self.popover.isShown else { return }
        self.popover.performClose(nil)
        self.store.setPopoverPresented(false)
    }

    private func shouldClosePopover(for event: NSEvent) -> Bool {
        guard let popoverWindow = self.popover.contentViewController?.view.window else { return true }
        if let buttonWindow = self.statusItem.button?.window,
           event.window?.windowNumber == buttonWindow.windowNumber {
            return false
        }
        return event.window == nil || event.window?.windowNumber != popoverWindow.windowNumber
    }

    private func showContextMenu(from button: NSStatusBarButton, event: NSEvent) {
        let menu = NSMenu()
        menu.autoenablesItems = false

        let refresh = NSMenuItem(title: "Refresh", action: #selector(self.refreshFromMenu(_:)), keyEquivalent: "")
        refresh.target = self
        menu.addItem(refresh)

        let copyJSON = NSMenuItem(title: "Copy JSON", action: #selector(self.copyJSONFromMenu(_:)), keyEquivalent: "")
        copyJSON.target = self
        menu.addItem(copyJSON)

        menu.addItem(.separator())

        let settings = NSMenuItem(title: "Settings", action: #selector(self.openSettingsFromMenu(_:)), keyEquivalent: "")
        settings.target = self
        menu.addItem(settings)

        let quit = NSMenuItem(title: "Quit", action: #selector(self.quitFromMenu(_:)), keyEquivalent: "")
        quit.target = self
        menu.addItem(quit)

        NSMenu.popUpContextMenu(menu, with: event, for: button)
    }

    @objc private func refreshFromMenu(_ sender: Any?) {
        self.store.refreshNow()
    }

    @objc private func copyJSONFromMenu(_ sender: Any?) {
        self.store.copySnapshotJSON()
    }

    @objc private func openSettingsFromMenu(_ sender: Any?) {
        self.openSettings()
    }

    @objc private func quitFromMenu(_ sender: Any?) {
        self.quit()
    }
}

extension StatusBarController: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        if response.actionIdentifier == "COPY_PORT" || response.actionIdentifier == UNNotificationDefaultActionIdentifier {
            let userInfo = response.notification.request.content.userInfo
            if let suggestedPort = userInfo["suggestedPort"] as? Int, suggestedPort > 0 {
                DispatchQueue.main.async {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(String(suggestedPort), forType: .string)
                }
            }
        }
        completionHandler()
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
}

// MARK: - Dot Matrix State Contract

enum WatchedPortDotState: Equatable {
    case free      // dim — port not busy
    case owned     // green — busy, your Node project, no conflict
    case blocked   // amber — busy, non-Node owner
    case conflict  // red — busy, multiple Node owners fighting

    init(from status: WatchedPortStatus) {
        if !status.isBusy {
            self = .free
        } else if !status.isConflict {
            self = .owned
        } else if !status.isNodeOwned {
            self = .blocked
        } else {
            self = .conflict
        }
    }

    var templateColor: NSColor {
        switch self {
        case .free: .black.withAlphaComponent(0.25)
        case .owned: .black.withAlphaComponent(0.85)
        case .blocked: .black.withAlphaComponent(0.65)
        case .conflict: .black
        }
    }

    func color(isDark: Bool) -> NSColor {
        switch self {
        case .free:
            isDark ? .white.withAlphaComponent(0.20) : .black.withAlphaComponent(0.20)
        case .owned:
            NSColor(calibratedRed: 0.30, green: 0.52, blue: 0.38, alpha: 1)
        case .blocked:
            NSColor(calibratedRed: 0.75, green: 0.55, blue: 0.20, alpha: 1)
        case .conflict:
            NSColor(calibratedRed: 0.68, green: 0.32, blue: 0.30, alpha: 1)
        }
    }
}

enum StatusChipRenderer {

    /// Format memory bytes into compact string: "2.1G", "362M", etc.
    private static func formatMemory(_ bytes: Int) -> String {
        let gb = Double(bytes) / (1024 * 1024 * 1024)
        if gb >= 1.0 {
            return String(format: "%.1fG", gb)
        }
        let mb = Double(bytes) / (1024 * 1024)
        if mb >= 1.0 {
            return String(format: "%.0fM", mb)
        }
        return "0M"
    }

    /// Build the status text for the menu bar based on display mode.
    static func statusText(for summary: SnapshotSummary, displayMode: MenuBarDisplayMode = .countAndMemory) -> String {
        let projects = summary.nodeProjectCount
        let memBytes = summary.nodeProcessTotalMemoryBytes
        let isActive = projects > 0 || memBytes > 100 * 1024 * 1024

        switch displayMode {
        case .iconOnly:
            return "N"

        case .countOnly:
            return isActive && projects > 0 ? "\(projects)" : "N"

        case .memoryOnly:
            return isActive ? formatMemory(memBytes) : "N"

        case .countAndMemory:
            if isActive {
                let memStr = formatMemory(memBytes)
                if projects > 0 {
                    return "\(projects) \u{00B7} \(memStr)"
                }
                return memStr
            }
            return "N"

        case .dotMatrix:
            // Dot matrix uses graphical rendering, not text. Fallback label only.
            return "N"
        }
    }

    /// Measure the text width for sizing the image.
    private static func measureText(_ text: String, font: NSFont) -> CGSize {
        let attrs: [NSAttributedString.Key: Any] = [.font: font]
        return (text as NSString).size(withAttributes: attrs)
    }

    /// Template image (no badge) — macOS auto-inverts for dark/light.
    static func templateImage(text: String, summary: SnapshotSummary) -> NSImage {
        let font = NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .medium)
        let textSize = measureText(text, font: font)
        let padding: CGFloat = 4
        let width = max(18, textSize.width + padding * 2)
        let height: CGFloat = 18
        let size = NSSize(width: width, height: height)

        return NSImage(size: size, flipped: false) { _ in
            let hasActivity = summary.nodeProjectCount > 0 || summary.watchedBusyCount > 0
            let color: NSColor = hasActivity ? .black : .black.withAlphaComponent(0.45)

            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center

            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: color,
                .paragraphStyle: paragraphStyle,
            ]
            let str = NSAttributedString(string: text, attributes: attrs)
            let strSize = str.size()
            let rect = NSRect(
                x: (size.width - strSize.width) / 2,
                y: (size.height - strSize.height) / 2,
                width: strSize.width,
                height: strSize.height
            )
            str.draw(in: rect)
            return true
        }
    }

    /// Non-template image with conflict badge — white circle, dark number.
    static func imageWithBadge(
        text: String,
        conflicts: Int,
        summary: SnapshotSummary,
        buttonAppearance: NSAppearance? = nil
    ) -> NSImage {
        let isDark = buttonAppearance?.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua

        let font = NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .medium)
        let textSize = measureText(text, font: font)
        let textPadding: CGFloat = 4
        let textWidth = max(18, textSize.width + textPadding * 2)
        let badgeSize: CGFloat = 12
        let badgeGap: CGFloat = 2
        let totalWidth = textWidth + badgeGap + badgeSize
        let height: CGFloat = 18
        let size = NSSize(width: totalWidth, height: height)

        return NSImage(size: size, flipped: false) { _ in
            let hasActivity = summary.nodeProjectCount > 0 || summary.watchedBusyCount > 0
            let textColor: NSColor
            if isDark {
                textColor = hasActivity ? .white : .white.withAlphaComponent(0.55)
            } else {
                textColor = hasActivity ? .black : .black.withAlphaComponent(0.45)
            }

            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center

            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: textColor,
                .paragraphStyle: paragraphStyle,
            ]
            let str = NSAttributedString(string: text, attributes: attrs)
            let strSize = str.size()
            let textRect = NSRect(
                x: (textWidth - strSize.width) / 2,
                y: (height - strSize.height) / 2,
                width: strSize.width,
                height: strSize.height
            )
            str.draw(in: textRect)

            let badgeRect = NSRect(
                x: totalWidth - badgeSize,
                y: height - badgeSize,
                width: badgeSize,
                height: badgeSize
            )
            (isDark ? NSColor.white.withAlphaComponent(0.85) : NSColor.black.withAlphaComponent(0.70)).setFill()
            NSBezierPath(ovalIn: badgeRect).fill()

            let badgeTextColor: NSColor = isDark ? .black : .white
            let badgeAttrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: 8, weight: .bold),
                .foregroundColor: badgeTextColor,
                .paragraphStyle: paragraphStyle,
            ]
            let badgeText = NSAttributedString(string: "\(min(conflicts, 9))", attributes: badgeAttrs)
            let badgeTextSize = badgeText.size()
            let badgeTextRect = NSRect(
                x: badgeRect.midX - badgeTextSize.width / 2,
                y: badgeRect.midY - badgeTextSize.height / 2,
                width: badgeTextSize.width,
                height: badgeTextSize.height
            )
            badgeText.draw(in: badgeTextRect)
            return true
        }
    }

    // MARK: - Dot Matrix Rendering

    private static let dotSize: CGFloat = 3
    private static let dotGap: CGFloat = 2
    private static let rowGap: CGFloat = 3

    /// Template dot matrix image (no badge) — macOS auto-inverts for dark/light.
    static func dotMatrixTemplateImage(watchedPorts: [WatchedPortStatus], projectCount: Int) -> NSImage {
        let cols = max(watchedPorts.count, projectCount, 1)
        let width = CGFloat(cols) * (dotSize + dotGap) - dotGap + 4
        let height: CGFloat = 18
        let size = NSSize(width: width, height: height)

        return NSImage(size: size, flipped: false) { _ in
            let topY = (height + rowGap) / 2
            let bottomY = (height - rowGap) / 2 - dotSize

            // Top row: project dots
            for i in 0..<projectCount {
                let x = 2 + CGFloat(i) * (dotSize + dotGap)
                let color: NSColor = .black.withAlphaComponent(0.85)
                color.setFill()
                NSBezierPath(ovalIn: NSRect(x: x, y: topY, width: dotSize, height: dotSize)).fill()
            }

            // Bottom row: watched-port dots
            for (i, status) in watchedPorts.enumerated() {
                let x = 2 + CGFloat(i) * (dotSize + dotGap)
                let state = WatchedPortDotState(from: status)
                state.templateColor.setFill()
                NSBezierPath(ovalIn: NSRect(x: x, y: bottomY, width: dotSize, height: dotSize)).fill()
            }
            return true
        }
    }

    /// Non-template dot matrix image with conflict badge.
    static func dotMatrixImageWithBadge(
        watchedPorts: [WatchedPortStatus],
        projectCount: Int,
        conflicts: Int,
        buttonAppearance: NSAppearance? = nil
    ) -> NSImage {
        let isDark = buttonAppearance?.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua

        let cols = max(watchedPorts.count, projectCount, 1)
        let dotsWidth = CGFloat(cols) * (dotSize + dotGap) - dotGap + 4
        let badgeSize: CGFloat = 12
        let badgeGap: CGFloat = 2
        let totalWidth = dotsWidth + badgeGap + badgeSize
        let height: CGFloat = 18
        let size = NSSize(width: totalWidth, height: height)

        return NSImage(size: size, flipped: false) { _ in
            let topY = (height + rowGap) / 2
            let bottomY = (height - rowGap) / 2 - dotSize

            // Top row: project dots (green)
            let projectColor = WatchedPortDotState.owned.color(isDark: isDark)
            for i in 0..<projectCount {
                let x = 2 + CGFloat(i) * (dotSize + dotGap)
                projectColor.setFill()
                NSBezierPath(ovalIn: NSRect(x: x, y: topY, width: dotSize, height: dotSize)).fill()
            }

            // Bottom row: watched-port dots (colored by state)
            for (i, status) in watchedPorts.enumerated() {
                let x = 2 + CGFloat(i) * (dotSize + dotGap)
                let state = WatchedPortDotState(from: status)
                state.color(isDark: isDark).setFill()
                NSBezierPath(ovalIn: NSRect(x: x, y: bottomY, width: dotSize, height: dotSize)).fill()
            }

            // Badge
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center

            let badgeRect = NSRect(
                x: totalWidth - badgeSize,
                y: height - badgeSize,
                width: badgeSize,
                height: badgeSize
            )
            (isDark ? NSColor.white.withAlphaComponent(0.85) : NSColor.black.withAlphaComponent(0.70)).setFill()
            NSBezierPath(ovalIn: badgeRect).fill()

            let badgeTextColor: NSColor = isDark ? .black : .white
            let badgeAttrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: 8, weight: .bold),
                .foregroundColor: badgeTextColor,
                .paragraphStyle: paragraphStyle,
            ]
            let badgeText = NSAttributedString(string: "\(min(conflicts, 9))", attributes: badgeAttrs)
            let badgeTextSize = badgeText.size()
            let badgeTextRect = NSRect(
                x: badgeRect.midX - badgeTextSize.width / 2,
                y: badgeRect.midY - badgeTextSize.height / 2,
                width: badgeTextSize.width,
                height: badgeTextSize.height
            )
            badgeText.draw(in: badgeTextRect)
            return true
        }
    }
}
