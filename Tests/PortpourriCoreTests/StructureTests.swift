import Foundation
import XCTest
@testable import PortpourriCore

final class StructureTests: XCTestCase {
    func testCoreTargetDoesNotImportUIFrameworks() throws {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let coreDirectory = repoRoot.appendingPathComponent("Sources/PortpourriCore", isDirectory: true)

        let enumerator = FileManager.default.enumerator(at: coreDirectory, includingPropertiesForKeys: nil)
        while let fileURL = enumerator?.nextObject() as? URL {
            guard fileURL.pathExtension == "swift" else { continue }
            let contents = try String(contentsOf: fileURL)
            XCTAssertFalse(contents.contains("import AppKit"), "Found AppKit import in \(fileURL.lastPathComponent)")
            XCTAssertFalse(contents.contains("import SwiftUI"), "Found SwiftUI import in \(fileURL.lastPathComponent)")
        }
    }

    func testSnapshotExportsAsJSON() throws {
        let snapshot = SnapshotService.sampleSnapshot()
        let data = try SnapshotService().exportJSON(snapshot: snapshot)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["projects"] as? [[String: Any]] != nil, true)
    }
}
