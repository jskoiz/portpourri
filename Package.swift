// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NodeTracker",
    platforms: [
        .macOS(.v14),
    ],
    products: [
        .library(name: "NodeTrackerCore", targets: ["NodeTrackerCore"]),
        .executable(name: "nodetracker", targets: ["NodeTrackerCLI"]),
        .executable(name: "NodeTrackerApp", targets: ["NodeTrackerApp"]),
    ],
    targets: [
        .target(
            name: "NodeTrackerCore",
            resources: [
                .process("Resources"),
            ]
        ),
        .executableTarget(
            name: "NodeTrackerCLI",
            dependencies: ["NodeTrackerCore"]
        ),
        .executableTarget(
            name: "NodeTrackerApp",
            dependencies: ["NodeTrackerCore"],
            resources: [
                .process("Resources"),
            ]
        ),
        .testTarget(
            name: "NodeTrackerCoreTests",
            dependencies: ["NodeTrackerCore"],
            resources: [
                .process("Fixtures"),
            ]
        ),
    ]
)
