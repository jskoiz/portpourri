import AppKit
import Combine
import NodeTrackerCore
import SwiftUI
import UserNotifications

@MainActor
final class StatusBarController: NSObject, NSPopoverDelegate {
    private let store: NodeTrackerStore
    private let statusItem: NSStatusItem
    private let popover = NSPopover()
    private var settingsWindow: NSWindow?
    private var cancellables: Set<AnyCancellable> = []
    private var localEventMonitor: Any?
    private var globalEventMonitor: Any?
    private var hotkeyMonitor: Any?
    private var localHotkeyMonitor: Any?

    init(store: NodeTrackerStore) {
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

        if !store.settings.hasCompletedPortOnboarding {
            DispatchQueue.main.async { [weak self] in
                self?.openSettings()
            }
        }
    }

    func openSettings() {
        if let existing = self.settingsWindow, existing.isVisible {
            existing.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let settingsView = SettingsRootView(store: self.store)
        let hostingController = NSHostingController(rootView: settingsView)

        let window = NSWindow(contentViewController: hostingController)
        window.title = "NodeWatcher Settings"
        window.styleMask = [.titled, .closable]
        window.center()
        window.isReleasedWhenClosed = false
        window.level = .floating

        self.settingsWindow = window
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
        button.toolTip = "NodeWatcher (\u{2303}\u{21E7}P)"
    }

    private func configurePopover() {
        self.popover.behavior = .semitransient
        self.popover.delegate = self
        self.popover.animates = true
        self.popover.contentSize = NSSize(width: 400, height: 100)
        let rootView = PopoverRootView(store: self.store)
        let hostingController = NSHostingController(rootView: rootView)
        // Let the view size itself; cap at a max height
        hostingController.sizingOptions = [.preferredContentSize]
        self.popover.contentViewController = hostingController
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

        let requiredModifiers = Self.parseModifiers(self.store.settings.hotkeyModifiers)
        let requiredKey = self.store.settings.hotkeyKey.lowercased()

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

        // Update tooltip
        let symbolStr = Self.modifierSymbols(self.store.settings.hotkeyModifiers) + self.store.settings.hotkeyKey.uppercased()
        self.statusItem.button?.toolTip = "NodeWatcher (\(symbolStr))"
    }

    static func parseModifiers(_ str: String) -> NSEvent.ModifierFlags {
        var flags: NSEvent.ModifierFlags = []
        let parts = str.lowercased().split(separator: "+").map { $0.trimmingCharacters(in: .whitespaces) }
        for part in parts {
            switch part {
            case "ctrl", "control": flags.insert(.control)
            case "shift": flags.insert(.shift)
            case "cmd", "command": flags.insert(.command)
            case "opt", "option", "alt": flags.insert(.option)
            default: break
            }
        }
        return flags
    }

    static func modifierSymbols(_ str: String) -> String {
        var symbols = ""
        let parts = str.lowercased().split(separator: "+").map { $0.trimmingCharacters(in: .whitespaces) }
        for part in parts {
            switch part {
            case "ctrl", "control": symbols += "\u{2303}"
            case "shift": symbols += "\u{21E7}"
            case "cmd", "command": symbols += "\u{2318}"
            case "opt", "option", "alt": symbols += "\u{2325}"
            default: break
            }
        }
        return symbols
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

    private func updateStatusImage() {
        let summary = self.store.snapshot.summary
        let isIdle = summary.nodeProjectCount == 0 && summary.watchedBusyCount == 0

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

        // Dot matrix mode uses its own renderer
        if displayMode == .dotMatrix {
            let buttonAppearance = button.effectiveAppearance
            let image = StatusChipRenderer.dotMatrixImage(
                summary: summary,
                conflicts: conflicts,
                showBadge: showBadge,
                buttonAppearance: buttonAppearance
            )
            image.isTemplate = false
            button.image = image
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
        case .dotMatrix:
            return "N"  // Not used for dot matrix rendering, but needed for exhaustiveness

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

    /// Dot matrix image: top row = project dots, bottom row = memory gauge blocks.
    static func dotMatrixImage(
        summary: SnapshotSummary,
        conflicts: Int,
        showBadge: Bool,
        buttonAppearance: NSAppearance? = nil
    ) -> NSImage {
        let isDark = buttonAppearance?.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua

        let projectCount = min(summary.nodeProjectCount, 8)
        let memBytes = summary.nodeProcessTotalMemoryBytes
        let isIdle = projectCount == 0 && memBytes < 50 * 1024 * 1024

        // Layout constants
        let dotSize: CGFloat = 4.0
        let dotGap: CGFloat = 2.5
        let blockWidth: CGFloat = 4.0
        let blockHeight: CGFloat = 3.0
        let blockGap: CGFloat = 1.5
        let rowGap: CGFloat = 2.0
        let totalBlocks = 5

        // Memory pressure: 0-5 blocks filled. Scale: 0=0MB, 5=2GB+
        let memMB = Double(memBytes) / (1024 * 1024)
        let filledBlocks: Int
        if memMB < 50 { filledBlocks = 0 }
        else if memMB < 200 { filledBlocks = 1 }
        else if memMB < 500 { filledBlocks = 2 }
        else if memMB < 1000 { filledBlocks = 3 }
        else if memMB < 2000 { filledBlocks = 4 }
        else { filledBlocks = 5 }

        // Calculate widths
        let dotsWidth = projectCount > 0
            ? CGFloat(projectCount) * dotSize + CGFloat(projectCount - 1) * dotGap
            : dotSize
        let blocksWidth = CGFloat(totalBlocks) * blockWidth + CGFloat(totalBlocks - 1) * blockGap
        let contentWidth = max(dotsWidth, blocksWidth)

        let badgeSize: CGFloat = 12
        let badgeGap: CGFloat = 2
        let hasBadge = conflicts > 0 && showBadge
        let hPad: CGFloat = 3
        let totalWidth = contentWidth + hPad * 2 + (hasBadge ? badgeGap + badgeSize : 0)
        let height: CGFloat = 18
        let size = NSSize(width: totalWidth, height: height)

        // Row positions (centered vertically)
        let totalContentHeight = dotSize + rowGap + blockHeight
        let topRowY = (height + totalContentHeight) / 2 - dotSize  // top row (dots)
        let bottomRowY = topRowY - rowGap - blockHeight             // bottom row (blocks)

        return NSImage(size: size, flipped: false) { _ in
            let baseColor: NSColor = isDark ? .white : .black
            let dimAlpha: CGFloat = 0.25
            let activeGreen = NSColor(calibratedRed: 0.30, green: 0.65, blue: 0.40, alpha: 1.0)
            let amber = NSColor(calibratedRed: 0.85, green: 0.60, blue: 0.20, alpha: 1.0)
            let red = NSColor(calibratedRed: 0.75, green: 0.30, blue: 0.28, alpha: 1.0)

            // --- Top row: project dots ---
            if isIdle {
                // Single dim dot when idle
                let x = hPad + (contentWidth - dotSize) / 2
                baseColor.withAlphaComponent(dimAlpha).setFill()
                NSBezierPath(ovalIn: NSRect(x: x, y: topRowY, width: dotSize, height: dotSize)).fill()
            } else {
                let dotsStartX = hPad + (contentWidth - dotsWidth) / 2
                for i in 0..<projectCount {
                    let x = dotsStartX + CGFloat(i) * (dotSize + dotGap)
                    activeGreen.setFill()
                    NSBezierPath(ovalIn: NSRect(x: x, y: topRowY, width: dotSize, height: dotSize)).fill()
                }
            }

            // --- Bottom row: memory gauge blocks ---
            let blocksStartX = hPad + (contentWidth - blocksWidth) / 2
            for i in 0..<totalBlocks {
                let x = blocksStartX + CGFloat(i) * (blockWidth + blockGap)
                let rect = NSRect(x: x, y: bottomRowY, width: blockWidth, height: blockHeight)

                if i < filledBlocks {
                    // Color: green for 1-2, amber for 3-4, red for 5
                    let blockColor: NSColor
                    if filledBlocks >= 5 { blockColor = red }
                    else if filledBlocks >= 3 { blockColor = amber }
                    else { blockColor = activeGreen }
                    blockColor.setFill()
                } else {
                    baseColor.withAlphaComponent(dimAlpha).setFill()
                }
                NSBezierPath(roundedRect: rect, xRadius: 0.5, yRadius: 0.5).fill()
            }

            // --- Conflict badge ---
            if hasBadge {
                let badgeRect = NSRect(
                    x: totalWidth - badgeSize,
                    y: height - badgeSize,
                    width: badgeSize,
                    height: badgeSize
                )
                (isDark ? NSColor.white.withAlphaComponent(0.85) : NSColor.black.withAlphaComponent(0.70)).setFill()
                NSBezierPath(ovalIn: badgeRect).fill()

                let badgeTextColor: NSColor = isDark ? .black : .white
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.alignment = .center
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
            }

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
}
