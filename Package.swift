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
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .executableTarget(
            name: "NodeTrackerCLI",
            dependencies: ["NodeTrackerCore"],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .executableTarget(
            name: "NodeTrackerApp",
            dependencies: ["NodeTrackerCore"],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .testTarget(
            name: "NodeTrackerCoreTests",
            dependencies: ["NodeTrackerCore"],
            resources: [
                .process("Fixtures"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
    ]
)
