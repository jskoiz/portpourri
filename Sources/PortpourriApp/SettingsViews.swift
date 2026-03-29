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
        .padding(20)
        .frame(width: 560, height: 480)
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: PortpourriStore
    @ObservedObject var settings: SettingsStore

    private static let modifierOptions = ["ctrl+shift", "cmd+shift", "cmd+opt", "ctrl+opt"]
    private static let keyOptions = ["P", "N", "W", "K", "J"]

    private var hotkeyDisplay: String {
        StatusBarController.modifierSymbols(self.settings.hotkeyModifiers) + self.settings.hotkeyKey.uppercased()
    }

    var body: some View {
        Form {
            Section("Startup") {
                Toggle("Start at login", isOn: self.$settings.launchAtLogin)
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
                        ForEach(Self.modifierOptions, id: \.self) { mod in
                            Text(StatusBarController.modifierSymbols(mod))
                                .tag(mod)
                        }
                    }
                    .frame(width: 140)

                    Picker("Key", selection: self.$settings.hotkeyKey) {
                        ForEach(Self.keyOptions, id: \.self) { key in
                            Text(key).tag(key)
                        }
                    }
                    .frame(width: 100)

                    Spacer()

                    Text(self.hotkeyDisplay)
                        .font(.system(.body, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.quaternary)
                        .cornerRadius(6)
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

            if let error = self.store.lastError {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.red)
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
                .frame(width: 6, height: 6)
            Text(self.label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
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
        .cornerRadius(6)
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
                        .frame(width: 4, height: 4)
                }
            }
            HStack(spacing: 2) {
                ForEach(Array(ports.enumerated()), id: \.offset) { _, status in
                    Circle()
                        .fill(Self.dotColor(for: status))
                        .frame(width: 4, height: 4)
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
                Text("Comma-separated list of ports to monitor. These ports are shown in the menu bar Dot Matrix and highlighted in the popover.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Port Suggestion") {
                TextField("Command template", text: self.$settings.portCommandTemplate, prompt: Text("PORT={port}"))
                Text("Copied to clipboard when using a suggested port. Use {port} as placeholder.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text("Example: PORT={port} npm run dev")
                    .font(.system(.footnote, design: .monospaced))
                    .foregroundStyle(.tertiary)
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
                            .frame(width: 20)
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
                            .frame(width: 20)
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
                            .frame(width: 20)
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
                            .frame(width: 20)
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
                            .frame(width: 20)
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
