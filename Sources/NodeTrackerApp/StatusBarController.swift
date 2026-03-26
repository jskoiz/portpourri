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

    init(store: NodeTrackerStore) {
        self.store = store
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        super.init()
        self.configureStatusItem()
        self.configurePopover()
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
        button.toolTip = "NodeWatcher"
    }

    private func configurePopover() {
        self.popover.behavior = .transient
        self.popover.delegate = self
        self.popover.animates = true
        self.popover.contentSize = NSSize(width: 416, height: 540)
        self.popover.contentViewController = NSHostingController(
            rootView: PopoverRootView(
                store: self.store,
                openSettings: { [weak self] in self?.openSettings() },
                quit: { [weak self] in self?.quit() }
            )
        )
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
        if self.popover.isShown {
            self.popover.performClose(sender)
            self.store.setPopoverPresented(false)
        } else {
            self.popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            self.store.setPopoverPresented(true)
        }
    }

    func popoverDidClose(_ notification: Notification) {
        self.store.setPopoverPresented(false)
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
