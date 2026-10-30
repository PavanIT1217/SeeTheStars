// Home-screen widget: tonight's Moon (worked out here, so it is right even if the app isn't opened),
// plus the best thing to see and the next bright space-station pass, as last saved by the app
// (SkyWidgetPlugin writes them to the shared App Group).
import SwiftUI
import WidgetKit

private let appGroup = "group.com.webappslab.seethestars"

struct SkyEntry: TimelineEntry {
    let date: Date
    let moonEmoji: String
    let moonText: String
    let top: String
    let pass: String
}

enum Moon {
    static let synodic = 29.530588853
    static let newMoon2000 = Date(timeIntervalSince1970: 947_182_440) // 2000-01-06 18:14 UT
    static let phases = [("🌑", "New Moon"), ("🌒", "Waxing crescent"), ("🌓", "First quarter"), ("🌔", "Waxing gibbous"),
                         ("🌕", "Full Moon"), ("🌖", "Waning gibbous"), ("🌗", "Last quarter"), ("🌘", "Waning crescent")]

    static func phase(at date: Date) -> (String, String) {
        var age = date.timeIntervalSince(newMoon2000) / 86400
        age = age.truncatingRemainder(dividingBy: synodic)
        if age < 0 { age += synodic }
        let lit = Int(((1 - cos(2 * .pi * age / synodic)) / 2 * 100).rounded())
        let p = phases[Int((age / synodic * 8).rounded()) % 8]
        return (p.0, "\(p.1) · \(lit)% lit")
    }
}

struct Provider: TimelineProvider {
    func entry(at date: Date) -> SkyEntry {
        let d = UserDefaults(suiteName: appGroup)
        let fresh = Date().timeIntervalSince1970 - (d?.double(forKey: "at") ?? 0) < 36 * 3600
        let (emoji, text) = Moon.phase(at: date)
        return SkyEntry(date: date, moonEmoji: emoji, moonText: text,
                        top: fresh ? (d?.string(forKey: "top") ?? "") : "Open See the Stars for tonight’s sky",
                        pass: fresh ? (d?.string(forKey: "pass") ?? "") : "")
    }

    func placeholder(in context: Context) -> SkyEntry {
        SkyEntry(date: Date(), moonEmoji: "🌔", moonText: "Waxing gibbous · 80% lit", top: "Tonight: Saturn", pass: "ISS flies over at 7:14 PM")
    }

    func getSnapshot(in context: Context, completion: @escaping (SkyEntry) -> Void) {
        completion(entry(at: Date()))
    }

    // Refresh every three hours so the Moon stays right; the app also asks for a reload when it saves new data.
    func getTimeline(in context: Context, completion: @escaping (Timeline<SkyEntry>) -> Void) {
        let now = Date()
        let entries = (0..<8).map { entry(at: now.addingTimeInterval(Double($0) * 3 * 3600)) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct SkyWidgetView: View {
    var entry: SkyEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        HStack(spacing: 12) {
            Text(entry.moonEmoji).font(.system(size: family == .systemSmall ? 30 : 40))
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.moonText).font(.caption).bold().foregroundStyle(Color(red: 1, green: 0.765, blue: 0.353))
                if !entry.top.isEmpty { Text(entry.top).font(.subheadline).bold().foregroundStyle(.white).lineLimit(2) }
                if !entry.pass.isEmpty && family != .systemSmall { Text(entry.pass).font(.caption).foregroundStyle(Color(white: 0.7)).lineLimit(2) }
            }
            Spacer(minLength: 0)
        }
        .widgetBackground(Color(red: 0.063, green: 0.075, blue: 0.122))
    }
}

extension View {
    /// iOS 17 wants the background declared for the widget; earlier versions just draw it.
    @ViewBuilder func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            padding().background(color)
        }
    }
}

@main
struct SkyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SkyWidget", provider: Provider()) { entry in
            SkyWidgetView(entry: entry)
        }
        .configurationDisplayName("Tonight’s sky")
        .description("Tonight’s Moon and the best thing to see.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
