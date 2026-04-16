import Foundation
import Security
import ServiceManagement

enum LaunchAtLoginError: Error, LocalizedError, Equatable {
    case unavailableOutsideAppBundle
    case requiresApplicationsInstall
    case requiresSignedBundle

    var errorDescription: String? {
        switch self {
        case .unavailableOutsideAppBundle:
            "Launch at login only works from a packaged app bundle."
        case .requiresApplicationsInstall:
            "Launch at login requires Portpourri to be installed in Applications."
        case .requiresSignedBundle:
            "Launch at login requires a signed app bundle."
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .unavailableOutsideAppBundle:
            "Launch Portpourri from a packaged `.app` bundle instead of `swift run`."
        case .requiresApplicationsInstall:
            "Move the packaged app to `/Applications` or `~/Applications`, then relaunch it."
        case .requiresSignedBundle:
            "Use the signed release build, or sign the packaged app before enabling Start at login."
        }
    }
}

enum LaunchAtLoginAvailability: Equatable {
    case supported
    case unsupported(LaunchAtLoginError)

    var isSupported: Bool {
        if case .supported = self {
            return true
        }
        return false
    }
}

enum LaunchAtLoginManager {
    static func apply(enabled: Bool) throws {
        switch self.availability() {
        case .supported:
            break
        case let .unsupported(error):
            if !enabled { return }
            throw error
        }

        if enabled {
            try SMAppService.mainApp.register()
        } else {
            try SMAppService.mainApp.unregister()
        }
    }

    static func availability(
        bundleURL: URL = Bundle.main.bundleURL,
        teamIdentifier: String? = currentTeamIdentifier()
    ) -> LaunchAtLoginAvailability {
        guard bundleURL.pathExtension == "app" else {
            return .unsupported(.unavailableOutsideAppBundle)
        }

        guard self.isInstalledInApplicationsFolder(bundleURL) else {
            return .unsupported(.requiresApplicationsInstall)
        }

        guard let teamIdentifier, !teamIdentifier.isEmpty else {
            return .unsupported(.requiresSignedBundle)
        }

        return .supported
    }

    private static func isInstalledInApplicationsFolder(_ bundleURL: URL) -> Bool {
        let parentDirectory = bundleURL
            .deletingLastPathComponent()
            .standardizedFileURL
            .resolvingSymlinksInPath()
            .path
        let allowedDirectories = [
            URL(fileURLWithPath: "/Applications", isDirectory: true),
            FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Applications", isDirectory: true),
        ].map { $0.standardizedFileURL.resolvingSymlinksInPath().path }

        return allowedDirectories.contains(parentDirectory)
    }

    private static func currentTeamIdentifier(bundleURL: URL = Bundle.main.bundleURL) -> String? {
        var staticCode: SecStaticCode?
        let createStatus = SecStaticCodeCreateWithPath(bundleURL as CFURL, SecCSFlags(), &staticCode)
        guard createStatus == errSecSuccess, let staticCode else { return nil }

        var signingInfo: CFDictionary?
        let infoStatus = SecCodeCopySigningInformation(
            staticCode,
            SecCSFlags(rawValue: kSecCSSigningInformation),
            &signingInfo
        )
        guard infoStatus == errSecSuccess,
              let signingInfo = signingInfo as? [String: Any] else { return nil }

        return signingInfo[kSecCodeInfoTeamIdentifier as String] as? String
    }
}
