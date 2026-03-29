// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Portpourri",
    platforms: [
        .macOS(.v14),
    ],
    products: [
        .library(name: "PortpourriCore", targets: ["PortpourriCore"]),
        .executable(name: "portpourri", targets: ["PortpourriCLI"]),
        .executable(name: "PortpourriApp", targets: ["PortpourriApp"]),
    ],
    targets: [
        .target(
            name: "PortpourriCore",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .executableTarget(
            name: "PortpourriCLI",
            dependencies: ["PortpourriCore"],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .executableTarget(
            name: "PortpourriApp",
            dependencies: ["PortpourriCore"],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .testTarget(
            name: "PortpourriCoreTests",
            dependencies: ["PortpourriCore"],
            resources: [
                .process("Fixtures"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
    ]
)
