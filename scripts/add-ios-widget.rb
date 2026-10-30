# Adds the SkyWidget WidgetKit extension (and the app's local plugin files) to ios/App/App.xcodeproj.
# Run once with: ruby scripts/add-ios-widget.rb   (uses the xcodeproj gem that ships with CocoaPods)
require 'xcodeproj'

project = Xcodeproj::Project.open(File.join(__dir__, '../ios/App/App.xcodeproj'))
app = project.targets.find { |t| t.name == 'App' }
abort 'SkyWidgetExtension already exists' if project.targets.any? { |t| t.name == 'SkyWidgetExtension' }

# The app's own plugin files.
app_group = project.main_group.find_subpath('App')
%w[SkyWidgetPlugin.swift MainViewController.swift].each do |f|
  app.add_file_references([app_group.new_file(f)]) unless app_group.files.any? { |x| x.path == f }
end

# The widget extension target.
widget = project.new_target(:app_extension, 'SkyWidgetExtension', :ios, '15.0') # same as the app, or `cap sync` raises everything
group = project.main_group.new_group('SkyWidget', 'SkyWidget')
widget.add_file_references([group.new_file('SkyWidget.swift')])
group.new_file('Info.plist')
group.new_file('SkyWidget.entitlements')
widget.add_system_framework(%w[WidgetKit SwiftUI])
widget.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.webappslab.seethestars.SkyWidget'
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'SkyWidget/Info.plist'
  s['CODE_SIGN_ENTITLEMENTS'] = 'SkyWidget/SkyWidget.entitlements'
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
  s['SKIP_INSTALL'] = 'YES'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  app_cfg = app.build_configurations.find { |a| a.name == c.name }.build_settings
  %w[MARKETING_VERSION CURRENT_PROJECT_VERSION DEVELOPMENT_TEAM CODE_SIGN_STYLE].each { |k| s[k] = app_cfg[k] if app_cfg[k] }
end

# Build it with the app and embed it in the app's PlugIns folder.
app.add_dependency(widget)
embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.dst_subfolder_spec = '13' # PlugIns
build_file = embed.add_file_reference(widget.product_reference, true)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts 'Added SkyWidgetExtension'
