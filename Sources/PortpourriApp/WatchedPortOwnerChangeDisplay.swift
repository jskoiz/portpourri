import PortpourriCore

extension DisplayText {
    static func watchedPortOwnerChange(_ status: WatchedPortStatus) -> String? {
        guard let change = status.ownerChange else { return nil }
        return "Changed: \(change.summary)"
    }
}
