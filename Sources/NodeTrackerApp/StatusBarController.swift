import AppKit
import Combine
import NodeTrackerCore
import SwiftUI

@MainActor
final class StatusBarController: NSObject, NSPopoverDelegate {
    private let store: NodeTrackerStore
    private let statusItem: NSStatusItem
    private let popover = NSPopover()
    private var cancellables: Set<AnyCancellable> = []
    private var localEventMonitor: Any?
    private var globalEventMonitor: Any?

    init(store: NodeTrackerStore) {
        self.store = store
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        super.init()
        self.configureStatusItem()
        self.configurePopover()
        self.installOutsideClickMonitors()
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
        button.toolTip = "NodeWatcher"
    }

    private func configurePopover() {
        self.popover.behavior = .semitransient
        self.popover.delegate = self
        self.popover.animates = true
        self.popover.contentSize = NSSize(width: 388, height: 520)
        self.popover.contentViewController = NSHostingController(
            rootView: PopoverRootView(store: self.store)
        )
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
            self.popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            self.store.setPopoverPresented(true)
        }
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

enum StatusChipRenderer {
    static func image(for summary: SnapshotSummary) -> NSImage {
        let size = NSSize(width: 28, height: 18)
        let image = NSImage(size: size)
        image.lockFocus()

        let topRect = NSRect(x: 2, y: 9, width: 20, height: 5)
        let bottomRect = NSRect(x: 2, y: 3, width: 20, height: 4)
        drawBar(
            in: topRect,
            filledSegments: min(summary.nodeProjectCount, 5),
            color: NSColor.systemBlue
        )
        drawBar(
            in: bottomRect,
            filledSegments: min(summary.watchedBusyCount, 5),
            color: summary.watchedNonNodeConflictCount > 0 ? NSColor.systemOrange : NSColor.systemTeal
        )

        if summary.watchedNonNodeConflictCount > 0 {
            let dotRect = NSRect(x: 23, y: 10, width: 4, height: 4)
            NSColor.systemOrange.setFill()
            NSBezierPath(ovalIn: dotRect).fill()
        }

        image.unlockFocus()
        return image
    }

    private static func drawBar(in rect: NSRect, filledSegments: Int, color: NSColor) {
        let segmentGap: CGFloat = 1
        let segmentWidth = (rect.width - 4 * segmentGap) / 5

        for index in 0..<5 {
            let x = rect.minX + CGFloat(index) * (segmentWidth + segmentGap)
            let segmentRect = NSRect(x: x, y: rect.minY, width: segmentWidth, height: rect.height)
            let path = NSBezierPath(roundedRect: segmentRect, xRadius: 1.5, yRadius: 1.5)
            (index < filledSegments ? color : NSColor.quaternaryLabelColor).setFill()
            path.fill()
        }
    }
}
