import Capacitor
import WidgetKit

/// Lets the web app hand the home-screen widget tonight's highlights (js/widget.js), via the shared App Group.
@objc(SkyWidgetPlugin)
public class SkyWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkyWidgetPlugin"
    public let jsName = "SkyWidget"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)]

    @objc func update(_ call: CAPPluginCall) {
        let d = UserDefaults(suiteName: "group.com.webappslab.seethestars")
        d?.set(call.getString("top") ?? "", forKey: "top")
        d?.set(call.getString("pass") ?? "", forKey: "pass")
        d?.set(Date().timeIntervalSince1970, forKey: "at")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
