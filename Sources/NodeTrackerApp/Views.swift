import SwiftUI
import NodeTrackerCore

struct PopoverRootView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject private var settings: SettingsStore
    let openSettings: () -> Void
    let quit: () -> Void

    init(store: NodeTrackerStore, openSettings: @escaping () -> Void, quit: @escaping () -> Void) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
        self.openSettings = openSettings
        self.quit = quit
    }

    var body: some View {
        let visibleOtherCount = self.store.visibleOtherProcesses().count
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HeaderCard(
                    snapshot: self.store.snapshot,
                    isRefreshing: self.store.isRefreshing,
                    useSampleData: self.store.useSampleData,
                    otherCount: visibleOtherCount,
                    otherCountTitle: self.settings.showNonNodeListeners ? "Other listeners" : "Conflicts shown"
                )
                WatchedPortsCard(statuses: self.store.snapshot.watchedPorts)
                if self.settings.groupMode == .project {
                    ProjectGroupsView(store: self.store)
                } else {
                    PortGroupsView(store: self.store)
                }
                if !self.store.visibleOtherProcesses().isEmpty {
                    OtherListenersCard(store: self.store, processes: self.store.visibleOtherProcesses())
                }
                FooterActions(
                    refresh: { self.store.refreshNow() },
                    copyJSON: { self.store.copySnapshotJSON() },
                    openSettings: self.openSettings,
                    quit: self.quit
                )
            }
            .padding(16)
        }
        .background(Color(nsColor: .windowBackgroundColor))
        .overlay(alignment: .bottomTrailing) {
            if let notice = self.store.clipboardNotice {
                Text(notice)
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.thinMaterial, in: Capsule())
                    .padding()
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            self.store.clipboardNotice = nil
                        }
                    }
            }
        }
    }
}

private struct HeaderCard: View {
    let snapshot: AppSnapshot
    let isRefreshing: Bool
    let useSampleData: Bool
    let otherCount: Int
    let otherCountTitle: String

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("NodeTracker")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text(self.useSampleData ? "Sample data mode" : self.relativeUpdatedText)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if self.isRefreshing {
                        ProgressView()
                            .controlSize(.small)
                    }
                }
                HStack(spacing: 12) {
                    SummaryMetric(title: "Node projects", value: String(self.snapshot.summary.nodeProjectCount))
                    SummaryMetric(title: "Busy watched", value: String(self.snapshot.summary.watchedBusyCount))
                    SummaryMetric(title: self.otherCountTitle, value: String(self.otherCount))
                }
            }
        }
    }

    private var relativeUpdatedText: String {
        let elapsed = Date().timeIntervalSince(self.snapshot.generatedAt)
        guard elapsed > 3 else { return "Updated just now" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return "Updated \(formatter.localizedString(fromTimeInterval: -elapsed))"
    }
}

private struct SummaryMetric: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(self.value)
                .font(.title2)
                .fontWeight(.semibold)
            Text(self.title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct WatchedPortsCard: View {
    let statuses: [WatchedPortStatus]

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 4)

    var body: some View {
        Card(title: "Watched ports") {
            LazyVGrid(columns: self.columns, alignment: .leading, spacing: 8) {
                ForEach(self.statuses) { status in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(verbatim: String(status.port))
                            .font(.system(.body, design: .monospaced))
                            .fontWeight(.semibold)
                        Text(status.isBusy ? status.ownerSummary : "Free")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(self.backgroundColor(for: status), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
        }
    }

    private func backgroundColor(for status: WatchedPortStatus) -> AnyShapeStyle {
        if status.isConflict {
            return AnyShapeStyle(Color.orange.opacity(0.18))
        }
        if status.isBusy {
            return AnyShapeStyle(Color.blue.opacity(0.16))
        }
        return AnyShapeStyle(Color.primary.opacity(0.05))
    }
}

private struct ProjectGroupsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(self.store.snapshot.projects) { project in
                ProjectCard(store: self.store, project: project)
            }
        }
    }
}

private struct PortGroupsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(self.groupedPorts(), id: \.port) { group in
                Card(title: "Port \(String(group.port))") {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(group.processes) { process in
                            ProcessRow(store: self.store, process: process)
                        }
                    }
                }
            }
        }
    }

    private func groupedPorts() -> [(port: Int, processes: [TrackedProcessSnapshot])] {
        let grouped = Dictionary(grouping: self.store.snapshot.allProcesses.flatMap { process in
            process.ports.map { ($0, process) }
        }, by: \.0)

        return grouped.keys.sorted().map { port in
            (port, grouped[port]?.map(\.1) ?? [])
        }
    }
}

private struct ProjectCard: View {
    @ObservedObject var store: NodeTrackerStore
    let project: ProjectSnapshot

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(self.project.displayName)
                                .font(.headline)
                            if self.project.isWorktreeLike {
                                Text("worktree")
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.16), in: Capsule())
                            }
                        }
                        Text(self.project.projectRoot)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    Spacer()
                    PortBadgeRow(ports: self.project.ports)
                }

                ForEach(self.project.processes) { process in
                    ProcessRow(store: self.store, process: process)
                }
            }
        }
    }
}

private struct ProcessRow: View {
    @ObservedObject var store: NodeTrackerStore
    let process: TrackedProcessSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(self.process.process.toolLabel)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text(verbatim: "PID \(self.process.process.pid)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(self.process.process.commandLine)
                .font(.caption)
                .foregroundStyle(.secondary)
                .textSelection(.enabled)
                .lineLimit(2)
                .truncationMode(.middle)

            HStack(spacing: 8) {
                PortBadgeRow(ports: self.process.ports)
                if let firstListener = self.process.listeners.first {
                    Text(firstListener.hostScope.label)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(self.process.process.uptime)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 6) {
                if self.canReveal {
                    MiniActionButton("Reveal") {
                        self.store.reveal(path: self.process.process.cwd)
                    }
                }
                if self.canOpenTerminal {
                    MiniActionButton("Terminal") {
                        self.store.openTerminal(path: self.process.process.cwd)
                    }
                }
                MiniActionButton("Copy PID") {
                    self.store.copyText(String(self.process.process.pid), label: "PID")
                }
                MiniActionButton("Copy Command") {
                    self.store.copyText(self.process.process.commandLine, label: "Command")
                }
                if self.canTerminate {
                    MiniActionButton("Terminate", role: .destructive) {
                        self.store.terminate(process: self.process)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .padding(12)
        .background(Color.primary.opacity(0.035), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var canReveal: Bool {
        self.hasMeaningfulDirectory
    }

    private var canOpenTerminal: Bool {
        self.process.process.isNodeFamily && self.hasMeaningfulDirectory
    }

    private var canTerminate: Bool {
        if self.process.process.isNodeFamily {
            return true
        }
        guard self.hasMeaningfulDirectory else { return false }
        let command = self.process.process.commandLine
        if command.hasPrefix("/System/") || command.hasPrefix("/usr/") || command.hasPrefix("/Applications/") {
            return false
        }
        return true
    }

    private var hasMeaningfulDirectory: Bool {
        guard let cwd = self.process.process.cwd, cwd != "/" else { return false }
        return FileManager.default.fileExists(atPath: cwd)
    }
}

private struct OtherListenersCard: View {
    @ObservedObject var store: NodeTrackerStore
    let processes: [TrackedProcessSnapshot]

    var body: some View {
        Card(title: "Other listeners") {
            VStack(alignment: .leading, spacing: 10) {
                if !self.store.settings.showNonNodeListeners {
                    Text("Showing watched-port conflicts only.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                ForEach(self.processes) { process in
                    ProcessRow(store: self.store, process: process)
                }
            }
        }
    }
}

private struct PortBadgeRow: View {
    let ports: [Int]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(self.ports, id: \.self) { port in
                Text(verbatim: String(port))
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.medium)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(Color.primary.opacity(0.08), in: Capsule())
            }
        }
    }
}

private struct FooterActions: View {
    let refresh: () -> Void
    let copyJSON: () -> Void
    let openSettings: () -> Void
    let quit: () -> Void

    var body: some View {
        Card {
            HStack {
                Button("Refresh", action: self.refresh)
                Button("Copy JSON", action: self.copyJSON)
                Spacer()
                Button("Settings", action: self.openSettings)
                Button("Quit", action: self.quit)
            }
            .buttonStyle(.plain)
            .font(.subheadline)
        }
    }
}

private struct MiniActionButton: View {
    let title: String
    let role: ButtonRole?
    let action: () -> Void

    init(_ title: String, role: ButtonRole? = nil, action: @escaping () -> Void) {
        self.title = title
        self.role = role
        self.action = action
    }

    var body: some View {
        Button(role: self.role, action: self.action) {
            Text(self.title)
                .font(.caption)
        }
        .buttonStyle(ActionPillButtonStyle(role: self.role))
    }
}

private struct ActionPillButtonStyle: ButtonStyle {
    let role: ButtonRole?

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(self.foreground(isPressed: configuration.isPressed))
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(self.background(isPressed: configuration.isPressed), in: Capsule())
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }

    private func foreground(isPressed: Bool) -> Color {
        if self.role == .destructive {
            return isPressed ? .red.opacity(0.75) : .red
        }
        return isPressed ? .primary.opacity(0.7) : .primary
    }

    private func background(isPressed: Bool) -> Color {
        if self.role == .destructive {
            return Color.red.opacity(isPressed ? 0.14 : 0.08)
        }
        return Color.primary.opacity(isPressed ? 0.09 : 0.05)
    }
}

private struct Card<Content: View>: View {
    let title: String?
    let content: Content

    init(title: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let title {
                Text(title)
                    .font(.headline)
            }
            self.content
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct SettingsRootView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject private var settings: SettingsStore

    init(store: NodeTrackerStore) {
        self.store = store
        self._settings = ObservedObject(wrappedValue: store.settings)
    }

    var body: some View {
        TabView {
            GeneralSettingsView(store: self.store, settings: self.settings)
                .tabItem { Label("General", systemImage: "gearshape") }
            DisplaySettingsView(settings: self.settings)
                .tabItem { Label("Display", systemImage: "eye") }
            AboutSettingsView(store: self.store)
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .padding(20)
        .frame(width: 560, height: 420)
    }
}

private struct GeneralSettingsView: View {
    @ObservedObject var store: NodeTrackerStore
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Toggle("Start at login", isOn: self.$settings.launchAtLogin)
            Picker("Refresh cadence", selection: self.$settings.refreshCadence) {
                ForEach(RefreshCadence.allCases) { cadence in
                    Text(cadence.label).tag(cadence)
                }
            }
            Toggle("Confirm before terminate", isOn: self.$settings.confirmBeforeTerminate)
            if self.store.useSampleData {
                Text("The app is currently running in sample-data mode.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            if let error = self.store.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
        }
        .formStyle(.grouped)
    }
}

private struct DisplaySettingsView: View {
    @ObservedObject var settings: SettingsStore

    var body: some View {
        Form {
            Picker("Group content by", selection: self.$settings.groupMode) {
                ForEach(GroupMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            Toggle("Show non-Node listeners", isOn: self.$settings.showNonNodeListeners)
            TextField("Watched ports", text: self.$settings.watchedPortsText, prompt: Text("3000,5173,8081"))
            Text("Comma-separated list of ports to highlight in the menu bar and popover.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
    }
}

private struct AboutSettingsView: View {
    @ObservedObject var store: NodeTrackerStore

    var body: some View {
        Form {
            LabeledContent("Version", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev")
            Button("Copy latest snapshot JSON") {
                self.store.copySnapshotJSON()
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
