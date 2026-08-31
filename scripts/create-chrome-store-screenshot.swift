#!/usr/bin/env swift

import AppKit
import Foundation

guard (3...4).contains(CommandLine.arguments.count) else {
    fputs("Usage: create-chrome-store-screenshot.swift <text> <output.png> [font]\n", stderr)
    exit(64)
}

let text = CommandLine.arguments[1]
let output = CommandLine.arguments[2]
let fontName = CommandLine.arguments.count == 4 ? CommandLine.arguments[3] : "PingFangTC-Regular"

guard let font = NSFont(name: fontName, size: 451) else {
    fputs("Error: Font not found: \(fontName)\n", stderr)
    exit(1)
}

guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: 1280,
    pixelsHigh: 800,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fputs("Error: Could not create a 1280x800 bitmap\n", stderr)
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
NSColor.black.setFill()
NSRect(x: 0, y: 0, width: 1280, height: 800).fill()

let renderedText = NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: NSColor.white, .kern: 8])
let textSize = renderedText.size()
renderedText.draw(at: NSPoint(x: (1280 - textSize.width) / 2 + 1, y: (800 - textSize.height) / 2 - 26))
context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fputs("Error: Could not encode PNG\n", stderr)
    exit(1)
}

do {
    try png.write(to: URL(fileURLWithPath: output))
} catch {
    fputs("Error: Could not write \(output): \(error.localizedDescription)\n", stderr)
    exit(1)
}
