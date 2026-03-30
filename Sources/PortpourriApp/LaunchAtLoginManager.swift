import Foundation
import ServiceManagement

enum LaunchAtLoginError: Error, LocalizedError {
    case unavailableOutsideAppBundle

    var errorDescription: String? {
        switch self {
        case .unavailableOutsideAppBundle:
            "Launch at login only works from a packaged app bundle."
        }
    }
}

enum LaunchAtLoginManager {
    static func apply(enabled: Bool) throws {
        guard Bundle.main.bundleURL.pathExtension == "app" else {
            if !enabled { return }
            throw LaunchAtLoginError.unavailableOutsideAppBundle
        }

        if enabled {
            try SMAppService.mainApp.register()
        } else {
            try SMAppService.mainApp.unregister()
        }
    }
}
