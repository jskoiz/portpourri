import Foundation
import PortpourriCore

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
