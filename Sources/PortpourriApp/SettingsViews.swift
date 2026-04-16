import SwiftUI
import PortpourriCore

struct SettingsRootView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject private var settings: SettingsStore

    init(store: PortpourriStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    var body: some View {
        TabView {
            GeneralSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("General", systemImage: "gearshape") }
            DisplaySettingsView(settings: self.settings, snapshot: self.store.snapshot)
                .tabItem { Label("Display", systemImage: "eye") }
            PortsSettingsView(settings: self.settings)
                .tabItem { Label("Ports", systemImage: "network") }
            AdvancedSettingsView(store: self.store)
                .tabItem { Label("Advanced", systemImage: "wrench") }
            AboutSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .padding(LayoutMetrics.settingsPadding)
        .frame(width: LayoutMetrics.settingsWindowWidth, height: LayoutMetrics.settingsWindowHeight)
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject var settings: SettingsStore

    var body: some View {
        let launchAtLoginAvailability = LaunchAtLoginManager.availability()

        Form {
            Section("Startup") {
                Toggle("Start at login", isOn: self.$settings.launchAtLogin)
                    .disabled(!launchAtLoginAvailability.isSupported && !self.settings.launchAtLogin)

                if case let .unsupported(error) = launchAtLoginAvailability {
                    Text(error.recoverySuggestion ?? error.localizedDescription)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Refresh") {
                Picker("Refresh cadence", selection: self.$settings.refreshCadence) {
                    ForEach(RefreshCadence.allCases) { cadence in
                        Text(cadence.label).tag(cadence)
                    }
                }
                Text("How often to scan for Node processes when the popover is closed.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Keyboard Shortcut") {
                HStack {
                    Picker("Modifiers", selection: self.$settings.hotkeyModifiers) {
                        ForEach(HotkeyModifierOption.allCases) { mod in
                            Text(mod.symbols)
                                .tag(mod)
                        }
                    }
                    .frame(width: LayoutMetrics.settingsModifierPickerWidth)
                    .accessibilityHint("Choose the modifier keys for the global popover shortcut.")

                    Picker("Key", selection: self.$settings.hotkeyKey) {
                        ForEach(HotkeyKeyOption.allCases) { key in
                            Text(key.rawValue).tag(key)
                        }
                    }
                    .frame(width: LayoutMetrics.settingsKeyPickerWidth)
                    .accessibilityHint("Choose the letter key for the global popover shortcut.")

                    Spacer()

                    Text(self.settings.hotkeyDisplay)
                        .font(.system(.body, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.quaternary)
                        .cornerRadius(LayoutMetrics.pillCornerRadius)
                        .accessibilityLabel("Current shortcut \(self.settings.hotkeyDisplay)")
                }
                Text("Global shortcut to toggle the Portpourri popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Safety") {
                Toggle("Confirm destructive actions", isOn: self.$settings.confirmBeforeTerminate)
                Text("Shows action-specific confirmation copy for Stop server, Free port, Stop tunnel, and Kill group.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Notifications") {
                Toggle("Notify on port conflicts", isOn: self.$settings.enableConflictNotifications)
                Toggle("Play notification sound", isOn: self.$settings.notificationSound)
                    .disabled(!self.settings.enableConflictNotifications)
                Text("Notifications appear when a non-Node process occupies a watched port.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if self.store.useSampleData {
                Section {
                    Label("Running in sample-data mode", systemImage: "testtube.2")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            if let issue = self.store.currentIssue {
                Section {
                    IssueCalloutView(issue: issue)
                }
            }
        }
        .formStyle(.grouped)
    }
}

private struct DisplaySettingsView: View {
    @ObservedObject var settings: SettingsStore
    let snapshot: AppSnapshot

    var body: some View {
        Form {
            Section("Menu Bar") {
                Picker("Menu bar display", selection: self.$settings.menuBarDisplayMode) {
                    ForEach(MenuBarDisplayMode.allCases) { mode in
                        HStack {
                            Text(mode.label)
                            Spacer()
                            Text(mode.description)
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        .tag(mode)
                    }
                }

                HStack {
                    Text("Preview")
                        .foregroundStyle(.secondary)
                    Spacer()
                    MenuBarPreview(
                        displayMode: self.settings.menuBarDisplayMode,
                        summary: self.snapshot.summary,
                        watchedPorts: self.snapshot.watchedPorts
                    )
                }

                Toggle("Show conflict badge", isOn: self.$settings.showConflictBadge)
                Toggle("Hide icon when idle", isOn: self.$settings.hideWhenIdle)
                Text("Hides the menu bar icon when no Node processes are running.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Appearance") {
                Picker("Theme", selection: self.$settings.appearanceMode) {
                    ForEach(AppearanceMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                Text("Use System to follow macOS, or force Light or Dark for the popover and settings window.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if self.settings.menuBarDisplayMode == .dotMatrix {
                Section("Dot Matrix Legend") {
                    HStack(spacing: 16) {
                        DotLegendItem(color: Palette.mutedGreen, label: "Your project")
                        DotLegendItem(color: Palette.mutedAmber, label: "Non-owned")
                        DotLegendItem(color: Palette.mutedRed, label: "Conflict")
                        DotLegendItem(color: Color.primary.opacity(0.25), label: "Free")
                    }
                    Text("Top row = active projects. Bottom row = watched port status.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Popover") {
                Picker("Group content by", selection: self.$settings.groupMode) {
                    ForEach(GroupMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                Text("Project mode shows compact project rows with nested process details. Port mode shows watched-port rows first.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Toggle("Show non-Node listeners", isOn: self.$settings.showNonNodeListeners)
            }
        }
        .formStyle(.grouped)
    }
}

private struct DotLegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(self.color)
                .frame(width: LayoutMetrics.statusDotSize, height: LayoutMetrics.statusDotSize)
            Text(self.label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct MenuBarPreview: View {
    let displayMode: MenuBarDisplayMode
    let summary: SnapshotSummary
    let watchedPorts: [WatchedPortStatus]

    var body: some View {
        HStack(spacing: 2) {
            if self.displayMode == .dotMatrix {
                self.dotMatrixPreview
            } else {
                Text(StatusChipRenderer.statusText(for: self.summary, displayMode: self.displayMode))
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.medium)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(.quaternary)
        .cornerRadius(LayoutMetrics.pillCornerRadius)
    }

    @ViewBuilder
    private var dotMatrixPreview: some View {
        let ports = Array(self.watchedPorts.sorted(by: { $0.port < $1.port }).prefix(5))
        let projects = min(self.summary.nodeProjectCount, 5)
        VStack(spacing: 2) {
            HStack(spacing: 2) {
                ForEach(0..<max(ports.count, projects, 1), id: \.self) { i in
                    Circle()
                        .fill(i < projects ? Palette.mutedGreen : Color.clear)
                        .frame(width: LayoutMetrics.matrixDotSize, height: LayoutMetrics.matrixDotSize)
                }
            }
            HStack(spacing: 2) {
                ForEach(Array(ports.enumerated()), id: \.offset) { _, status in
                    Circle()
                        .fill(Self.dotColor(for: status))
                        .frame(width: LayoutMetrics.matrixDotSize, height: LayoutMetrics.matrixDotSize)
                }
            }
        }
    }

    private static func dotColor(for status: WatchedPortStatus) -> Color {
        switch WatchedPortDotState(from: status) {
        case .free: return Color.primary.opacity(0.25)
        case .owned: return Palette.mutedGreen
        case .blocked: return Palette.mutedAmber
        case .conflict: return Palette.mutedRed
        }
    }
}

private struct PortsSettingsView: View {
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Section("Watched Ports") {
                TextField("Ports", text: self.$settings.watchedPortsText, prompt: Text("3000,5173,8081"))
                    .accessibilityHint("Enter a comma-separated list of ports to monitor.")
                Text("Comma-separated list of ports to monitor. These ports are shown in the menu bar Dot Matrix and highlighted in the popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if let issue = self.settings.watchedPortsIssue {
                    ValidationIssueText(issue: issue)
                }
            }

            Section("Port Suggestion") {
                TextField("Command template", text: self.$settings.portCommandTemplate, prompt: Text(CopyTemplate.defaultPortCommand))
                    .accessibilityHint("Use \(CopyTemplate.portPlaceholder) where the suggested port should be inserted.")
                Text("Copied to clipboard when using a suggested port. Use {port} as placeholder.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text("Example: PORT={port} npm run dev")
                    .font(.system(.footnote, design: .monospaced))
                    .foregroundStyle(.tertiary)
                if let issue = self.settings.portCommandTemplateIssue {
                    ValidationIssueText(issue: issue)
                }
            }
        }
        .formStyle(.grouped)
    }
}

private struct AdvancedSettingsView: View {
    @ObservedObject var store: PortpourriStore

    var body: some View {
        Form {
            Section("Export") {
                Button("Copy latest snapshot JSON") {
                    self.store.copySnapshotJSON()
                }
                if let notice = self.store.clipboardNotice {
                    Text(notice)
                        .font(.footnote)
                        .foregroundStyle(.green)
                }
            }

            Section("Diagnostics") {
                Button("Refresh probe diagnostics") {
                    self.store.refreshDiagnostics()
                }
                if let report = self.store.diagnosticsReport {
                    DiagnosticCheckRow(title: "Listener probe", result: report.listenerProbe)
                    DiagnosticCheckRow(title: "Metadata enrichment", result: report.metadataEnrichment)
                    DiagnosticCheckRow(title: "Inventory scan", result: report.inventoryScan)
                } else if self.store.useSampleData {
                    Text("Diagnostics are hidden in sample-data mode.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Run the diagnostics refresh to confirm `lsof` and `ps` are working in the current environment.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                ForEach(self.store.snapshot.diagnostics.commands, id: \.self) { command in
                    Text(command)
                        .font(.system(.footnote, design: .monospaced))
                        .textSelection(.enabled)
                }
            }
        }
        .formStyle(.grouped)
    }
}

private struct AboutSettingsView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject var settings: SettingsStore

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev"
    }

    private var buildNumber: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "-"
    }

    private var buildTime: String {
        Bundle.main.object(forInfoDictionaryKey: "NWBuildTimestamp") as? String ?? "Unknown"
    }

    var body: some View {
        Form {
            Section {
                HStack(spacing: 16) {
                    Image(systemName: "network")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Portpourri")
                            .font(.title2.bold())
                        Text("v\(self.appVersion) (build \(self.buildNumber))")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Built \(self.buildTime)")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section("Links") {
                Link(destination: URL(string: "https://www.portpourri.com")!) {
                    HStack {
                        Image(systemName: "globe")
                            .frame(width: LayoutMetrics.iconColumnWidth)
                        Text("Website")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri")!) {
                    HStack {
                        Image(systemName: "chevron.left.forwardslash.chevron.right")
                            .frame(width: LayoutMetrics.iconColumnWidth)
                        Text("GitHub Repository")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri/issues")!) {
                    HStack {
                        Image(systemName: "exclamationmark.bubble")
                            .frame(width: LayoutMetrics.iconColumnWidth)
                        Text("Issues & Feedback")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://github.com/jskoiz/portpourri/releases")!) {
                    HStack {
                        Image(systemName: "tag")
                            .frame(width: LayoutMetrics.iconColumnWidth)
                        Text("Release Notes")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                Link(destination: URL(string: "https://x.com/jskoiz")!) {
                    HStack {
                        Image(systemName: "at")
                            .frame(width: LayoutMetrics.iconColumnWidth)
                        Text("@jskoiz on X")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .formStyle(.grouped)
    }
}

private struct ValidationIssueText: View {
    let issue: SettingsValidationIssue

    private var color: Color {
        switch self.issue.severity {
        case .warning: Palette.mutedAmber
        case .error: Palette.mutedRed
        }
    }

    var body: some View {
        Label(self.issue.message, systemImage: "exclamationmark.circle")
            .font(.footnote)
            .foregroundStyle(self.color)
            .accessibilityElement(children: .combine)
    }
}

private struct DiagnosticCheckRow: View {
    let title: String
    let result: ProbeCheckResult

    private var iconName: String {
        switch self.result.status {
        case .ok: "checkmark.circle.fill"
        case .failed: "xmark.circle.fill"
        }
    }

    private var color: Color {
        switch self.result.status {
        case .ok: Palette.mutedGreen
        case .failed: Palette.mutedRed
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Label(self.title, systemImage: self.iconName)
                .font(.footnote)
                .foregroundStyle(self.color)
            if let detail = self.result.detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
            }
        }
        .accessibilityElement(children: .combine)
    }
}
