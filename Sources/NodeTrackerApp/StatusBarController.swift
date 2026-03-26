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
    private var cancellables: Set<AnyCancellable> = []
    private var localEventMonitor: Any?
    private var globalEventMonitor: Any?
    private var hotkeyMonitor: Any?

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
    }

    func openSettings() {
        NSApp.activate(ignoringOtherApps: true)
        _ = NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
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
        self.popover.appearance = NSAppearance(named: .aqua)
        self.popover.contentSize = NSSize(width: 400, height: 100)
        let rootView = PopoverRootView(store: self.store)
        let hostingController = NSHostingController(rootView: rootView)
        hostingController.view.appearance = NSAppearance(named: .aqua)
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
        self.hotkeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Ctrl+Shift+P
            guard event.modifierFlags.contains([.control, .shift]),
                  event.charactersIgnoringModifiers?.lowercased() == "p" else { return }
            Task { @MainActor in
                self?.togglePopoverFromHotkey()
            }
        }

        // Also handle when the app is in the foreground
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard event.modifierFlags.contains([.control, .shift]),
                  event.charactersIgnoringModifiers?.lowercased() == "p" else { return event }
            Task { @MainActor in
                self?.togglePopoverFromHotkey()
            }
            return nil
        }
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
    }

    private func updateStatusImage() {
        let image = StatusChipRenderer.image(for: self.store.snapshot.summary)
        image.isTemplate = false
        self.statusItem.button?.image = image
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
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(String(suggestedPort), forType: .string)
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
    static func image(for summary: SnapshotSummary) -> NSImage {
        let conflicts = summary.watchedNonNodeConflictCount
        let size = NSSize(width: conflicts > 0 ? 28 : 18, height: 18)
        let image = NSImage(size: size)
        image.lockFocus()

        // Draw "N" glyph
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center

        let hasActivity = summary.nodeProjectCount > 0 || summary.watchedBusyCount > 0
        let glyphColor: NSColor = hasActivity ? .controlTextColor : .tertiaryLabelColor

        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 12, weight: .bold),
            .foregroundColor: glyphColor,
            .paragraphStyle: paragraphStyle,
        ]
        let glyph = NSAttributedString(string: "N", attributes: attrs)
        let glyphSize = glyph.size()
        let glyphRect = NSRect(
            x: (18 - glyphSize.width) / 2,
            y: (size.height - glyphSize.height) / 2,
            width: glyphSize.width,
            height: glyphSize.height
        )
        glyph.draw(in: glyphRect)

        // Draw red badge for conflicts
        if conflicts > 0 {
            let badgeSize: CGFloat = 12
            let badgeRect = NSRect(x: size.width - badgeSize, y: size.height - badgeSize, width: badgeSize, height: badgeSize)
            NSColor.systemOrange.setFill()
            NSBezierPath(ovalIn: badgeRect).fill()

            let badgeAttrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: 8, weight: .bold),
                .foregroundColor: NSColor.white,
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

        image.unlockFocus()
        return image
    }
}
