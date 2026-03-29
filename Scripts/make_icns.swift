#!/usr/bin/env swift
// make_icns.swift — converts an SVG file to an .icns file using AppKit
// Usage: swift Scripts/make_icns.swift <input.svg> <output.icns>

import AppKit
import Foundation

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: swift make_icns.swift <input.svg> <output.icns>\n", stderr)
    exit(1)
}

let svgPath  = CommandLine.arguments[1]
let icnsPath = CommandLine.arguments[2]

guard let srcImage = NSImage(contentsOfFile: svgPath) else {
    fputs("Error: could not load \(svgPath)\n", stderr)
    exit(1)
}

// Required iconset entries: (filename, pixel size)
let sizes: [(String, Int)] = [
    ("icon_16x16",      16),
    ("icon_16x16@2x",   32),
    ("icon_32x32",      32),
    ("icon_32x32@2x",   64),
    ("icon_128x128",   128),
    ("icon_128x128@2x",256),
    ("icon_256x256",   256),
    ("icon_256x256@2x",512),
    ("icon_512x512",   512),
    ("icon_512x512@2x",1024),
]

let fm = FileManager.default
let iconsetURL = URL(fileURLWithPath: NSTemporaryDirectory())
    .appendingPathComponent("AppIcon.iconset")

try? fm.removeItem(at: iconsetURL)
try fm.createDirectory(at: iconsetURL, withIntermediateDirectories: true)

func renderPNG(_ source: NSImage, size: Int) -> Data? {
    let px = CGFloat(size)
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4,
        hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0
    )!
    rep.size = NSSize(width: px, height: px)

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    source.draw(in: NSRect(x: 0, y: 0, width: px, height: px),
                from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()

    return rep.representation(using: .png, properties: [:])
}

for (name, px) in sizes {
    guard let png = renderPNG(srcImage, size: px) else {
        fputs("Error rendering \(px)x\(px)\n", stderr)
        exit(1)
    }
    let dest = iconsetURL.appendingPathComponent("\(name).png")
    try png.write(to: dest)
    print("  \(name).png")
}

// Run iconutil to produce the .icns
let task = Process()
task.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
task.arguments = ["-c", "icns", iconsetURL.path, "-o", icnsPath]
try task.run()
task.waitUntilExit()

try? fm.removeItem(at: iconsetURL)

guard task.terminationStatus == 0 else {
    fputs("iconutil failed\n", stderr)
    exit(1)
}

print("Created \(icnsPath)")
