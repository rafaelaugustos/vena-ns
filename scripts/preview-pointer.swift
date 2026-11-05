import Cocoa
import ApplicationServices

// Supplies simulator-only pointer input. No taps, touch events or network server.
func simctl(_ arguments: [String]) throws -> Data {
    let process = Process(), output = Pipe()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/xcrun")
    process.arguments = ["simctl"] + arguments
    process.standardOutput = output
    try process.run()
    let data = output.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    guard process.terminationStatus == 0 else { throw NSError(domain: "simctl", code: Int(process.terminationStatus)) }
    return data
}

func attribute(_ element: AXUIElement, _ key: String) -> CFTypeRef? {
    var value: CFTypeRef?
    AXUIElementCopyAttributeValue(element, key as CFString, &value)
    return value
}

func findAnchor(_ element: AXUIElement, depth: Int = 0) -> AXUIElement? {
    if depth > 15 { return nil }
    if attribute(element, kAXDescriptionAttribute) as? String == "My heart" { return element }
    for child in attribute(element, kAXChildrenAttribute) as? [AXUIElement] ?? [] {
        if let found = findAnchor(child, depth: depth + 1) { return found }
    }
    return nil
}

struct Rect: Decodable { let x: Double, y: Double, width: Double, height: Double }
struct Viewport: Decodable { let scene: Rect, anchor: Rect }

guard CommandLine.arguments.count >= 2 else {
    print("Usage: npm run pointer -- <simulator-udid>")
    exit(1)
}
let udid = CommandLine.arguments[1]
let container = String(data: try simctl(["get_app_container", udid, "dev.rafaelaugusto.vena", "data"]), encoding: .utf8)!.trimmingCharacters(in: .whitespacesAndNewlines)
// NativeScript's knownFolders.temp() resolves to Library/Caches on iOS.
let directory = URL(fileURLWithPath: container).appendingPathComponent("Library/Caches")
let input = directory.appendingPathComponent("vena-pointer.json")
let layout = directory.appendingPathComponent("vena-viewport.json")
let devices = try JSONSerialization.jsonObject(with: simctl(["list", "devices", "--json"])) as! [String: Any]
let groups = devices["devices"] as! [String: [[String: Any]]]
let deviceName = groups.values.flatMap { $0 }.first { $0["udid"] as? String == udid }?["name"] as? String ?? udid
let probe = CommandLine.arguments.count == 5 && CommandLine.arguments[2] == "--probe"
if !probe && !AXIsProcessTrusted() {
    print("Allow your terminal in macOS System Settings > Privacy & Security > Accessibility, then run again.")
    exit(1)
}
setbuf(stdout, nil)
print(probe ? "Sending a stationary test pointer to Vena." : "Pointer preview ready. Select \(deviceName) in Device Hub or Simulator and move the mouse over Vena. Ctrl-C stops the helper.")

var viewport: Viewport?, anchorOrigin = CGPoint.zero, scale = 0.0
var targetPID: pid_t = 0
var lastLayoutCheck = Date.distantPast
let started = Date()
let timer = Timer(timeInterval: 1.0 / 30, repeats: true) { _ in
    let now = Date()
    if now.timeIntervalSince(lastLayoutCheck) > 0.2 {
        lastLayoutCheck = now
        viewport = (try? Data(contentsOf: layout)).flatMap { try? JSONDecoder().decode(Viewport.self, from: $0) }
        scale = 0
        if let host = NSWorkspace.shared.runningApplications.first(where: { ["Device Hub", "Simulator"].contains($0.localizedName ?? "") }) {
            targetPID = host.processIdentifier
            let app = AXUIElementCreateApplication(targetPID)
            if let value = attribute(app, kAXFocusedWindowAttribute) {
                let window = value as! AXUIElement
                let title = attribute(window, kAXTitleAttribute) as? String ?? ""
                if title.hasPrefix(deviceName), let anchor = findAnchor(window), let viewport,
                   let position = attribute(anchor, kAXPositionAttribute), let size = attribute(anchor, kAXSizeAttribute) {
                    var dimensions = CGSize.zero
                    AXValueGetValue(position as! AXValue, .cgPoint, &anchorOrigin)
                    AXValueGetValue(size as! AXValue, .cgSize, &dimensions)
                    if viewport.anchor.width > 0 { scale = dimensions.width / viewport.anchor.width }
                }
            }
        }
    }
    var x = 0.0, y = 0.0, active = false
    if probe {
        x = Double(CommandLine.arguments[3]) ?? 0
        y = Double(CommandLine.arguments[4]) ?? 0
        active = true
        if now.timeIntervalSince(started) > 8 { try? FileManager.default.removeItem(at: input); exit(0) }
    } else if let viewport, scale > 0, NSWorkspace.shared.frontmostApplication?.processIdentifier == targetPID,
              let cursor = CGEvent(source: nil)?.location {
        x = (cursor.x - anchorOrigin.x) / scale + viewport.anchor.x - viewport.scene.x
        y = (cursor.y - anchorOrigin.y) / scale + viewport.anchor.y - viewport.scene.y
        active = x >= 0 && y >= 0 && x <= viewport.scene.width && y <= viewport.scene.height
    }
    let packet: [Any] = [x, y, active, now.timeIntervalSince1970 * 1000]
    if let data = try? JSONSerialization.data(withJSONObject: packet) { try? data.write(to: input, options: .atomic) }
}
RunLoop.main.add(timer, forMode: .common)
RunLoop.main.run()
