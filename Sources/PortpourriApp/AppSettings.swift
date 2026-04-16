import AppKit
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

enum AppearanceMode: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { self.rawValue }

    var label: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    var nsAppearanceName: NSAppearance.Name? {
        switch self {
        case .system:
            nil
        case .light:
            .aqua
        case .dark:
            .darkAqua
        }
    }
}

enum HotkeyModifierOption: String, CaseIterable, Identifiable {
    case controlShift = "ctrl+shift"
    case commandShift = "cmd+shift"
    case commandOption = "cmd+opt"
    case controlOption = "ctrl+opt"

    var id: String { self.rawValue }

    var eventFlags: NSEvent.ModifierFlags {
        switch self {
        case .controlShift: [.control, .shift]
        case .commandShift: [.command, .shift]
        case .commandOption: [.command, .option]
        case .controlOption: [.control, .option]
        }
    }

    var symbols: String {
        switch self {
        case .controlShift: "\u{2303}\u{21E7}"
        case .commandShift: "\u{2318}\u{21E7}"
        case .commandOption: "\u{2318}\u{2325}"
        case .controlOption: "\u{2303}\u{2325}"
        }
    }
}

enum HotkeyKeyOption: String, CaseIterable, Identifiable {
    case p = "P"
    case n = "N"
    case w = "W"
    case k = "K"
    case j = "J"

    var id: String { self.rawValue }

    var eventKey: String {
        self.rawValue.lowercased()
    }
}

enum SettingsIssueSeverity: Equatable {
    case warning
    case error
}

struct SettingsValidationIssue: Equatable {
    let severity: SettingsIssueSeverity
    let message: String
}

enum SettingsValidation {
    private static let validPortRange = 1...65_535

    static func parsedWatchedPorts(from text: String) -> [Int] {
        let ports = text
            .split(separator: ",")
            .compactMap { Int($0.trimmingCharacters(in: .whitespacesAndNewlines)) }
            .filter { validPortRange.contains($0) }
        return Array(Set(ports)).sorted()
    }

    static func watchedPortsIssue(for text: String) -> SettingsValidationIssue? {
        let tokens = text
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard !tokens.isEmpty else {
            return SettingsValidationIssue(
                severity: .error,
                message: "Enter at least one watched port between 1 and 65535."
            )
        }

        let invalidTokens = tokens.filter { Int($0) == nil }
        if !invalidTokens.isEmpty {
            return SettingsValidationIssue(
                severity: .error,
                message: "Watched ports must be comma-separated numbers. Invalid: \(invalidTokens.joined(separator: ", "))."
            )
        }

        let parsedPorts = tokens.compactMap(Int.init)
        let outOfRange = parsedPorts.filter { !validPortRange.contains($0) }
        if !outOfRange.isEmpty {
            let values = outOfRange.map(String.init).joined(separator: ", ")
            return SettingsValidationIssue(
                severity: .error,
                message: "Ports must stay between 1 and 65535. Out of range: \(values)."
            )
        }

        let duplicates = Dictionary(grouping: parsedPorts, by: { $0 })
            .filter { $1.count > 1 }
            .map(\.key)
            .sorted()

        if !duplicates.isEmpty {
            return SettingsValidationIssue(
                severity: .warning,
                message: "Duplicate ports are collapsed automatically: \(duplicates.map(String.init).joined(separator: ", "))."
            )
        }

        return nil
    }

    static func portCommandTemplateIssue(for template: String) -> SettingsValidationIssue? {
        let trimmed = template.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return SettingsValidationIssue(
                severity: .error,
                message: "Enter a command template so suggested ports can be copied."
            )
        }

        guard trimmed.contains(CopyTemplate.portPlaceholder) else {
            return SettingsValidationIssue(
                severity: .error,
                message: "Include \(CopyTemplate.portPlaceholder) so Portpourri knows where to insert the suggestion."
            )
        }

        return nil
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

    @Published var appearanceMode: AppearanceMode {
        didSet {
            UserDefaults.standard.set(self.appearanceMode.rawValue, forKey: "appearanceMode")
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

    @Published var hotkeyModifiers: HotkeyModifierOption {
        didSet {
            UserDefaults.standard.set(self.hotkeyModifiers.rawValue, forKey: "hotkeyModifiers")
            self.onChange?()
        }
    }

    @Published var hotkeyKey: HotkeyKeyOption {
        didSet {
            UserDefaults.standard.set(self.hotkeyKey.rawValue, forKey: "hotkeyKey")
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
        self.groupMode = GroupMode(rawValue: defaults.string(forKey: "groupMode") ?? GroupMode.port.rawValue) ?? .port
        self.showNonNodeListeners = defaults.object(forKey: "showNonNodeListeners") as? Bool ?? false
        self.watchedPortsText = defaults.string(forKey: "watchedPortsText") ?? Self.defaultWatchedPortsText
        self.menuBarDisplayMode = MenuBarDisplayMode(rawValue: defaults.string(forKey: "menuBarDisplayMode") ?? "") ?? .countAndMemory
        self.appearanceMode = AppearanceMode(rawValue: defaults.string(forKey: "appearanceMode") ?? "") ?? .system
        self.enableConflictNotifications = defaults.object(forKey: "enableConflictNotifications") as? Bool ?? true
        self.notificationSound = defaults.object(forKey: "notificationSound") as? Bool ?? true
        self.hideWhenIdle = defaults.object(forKey: "hideWhenIdle") as? Bool ?? false
        self.showConflictBadge = defaults.object(forKey: "showConflictBadge") as? Bool ?? true
        self.hotkeyModifiers = HotkeyModifierOption(rawValue: defaults.string(forKey: "hotkeyModifiers") ?? "") ?? .controlShift
        self.hotkeyKey = HotkeyKeyOption(rawValue: defaults.string(forKey: "hotkeyKey") ?? "") ?? .p
        self.portCommandTemplate = defaults.string(forKey: "portCommandTemplate") ?? CopyTemplate.defaultPortCommand
    }

    var watchedPorts: [Int] {
        SettingsValidation.parsedWatchedPorts(from: self.watchedPortsText)
    }

    var watchedPortsIssue: SettingsValidationIssue? {
        SettingsValidation.watchedPortsIssue(for: self.watchedPortsText)
    }

    var portCommandTemplateIssue: SettingsValidationIssue? {
        SettingsValidation.portCommandTemplateIssue(for: self.portCommandTemplate)
    }

    var resolvedPortCommandTemplate: String {
        let trimmed = self.portCommandTemplate.trimmingCharacters(in: .whitespacesAndNewlines)
        guard self.portCommandTemplateIssue == nil else { return CopyTemplate.defaultPortCommand }
        return trimmed
    }

    var hotkeyDisplay: String {
        self.hotkeyModifiers.symbols + self.hotkeyKey.rawValue
    }
}
