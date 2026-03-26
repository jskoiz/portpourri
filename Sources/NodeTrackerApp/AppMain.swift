import AppKit
import SwiftUI

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let store = NodeTrackerStore(
        useSampleData: ProcessInfo.processInfo.arguments.contains("--sample-data") ||
            ProcessInfo.processInfo.environment["NODETRACKER_SAMPLE_DATA"] == "1"
    )

    private var statusBarController: StatusBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        self.store.start()
        self.statusBarController = StatusBarController(store: self.store)
    }

    func applicationWillTerminate(_ notification: Notification) {
        self.store.stop()
    }
}

@main
struct NodeTrackerAppMain: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        Settings {
            SettingsRootView(store: self.appDelegate.store)
        }
    }
}
