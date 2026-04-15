import CoreGraphics

enum LayoutMetrics {
    static let popoverWidth: CGFloat = 340
    static let popoverSectionSpacing: CGFloat = 8
    static let popoverHorizontalPadding: CGFloat = 14
    static let popoverVerticalPadding: CGFloat = 12
    static let cardCornerRadius: CGFloat = 8
    static let cardBorderWidth: CGFloat = 0.5
    static let cardRowSpacing: CGFloat = 6
    static let compactDividerOpacity: CGFloat = 0.06
    static let infoColumnSpacing: CGFloat = 4
    static let countColumnWidth: CGFloat = 28
    static let iconColumnWidth: CGFloat = 20
    static let sidebarRuleWidth: CGFloat = 1
    static let statusDotSize: CGFloat = 6
    static let matrixDotSize: CGFloat = 4
    static let processDrawerMaxHeight: CGFloat = 160
    static let settingsPadding: CGFloat = 20
    static let settingsWindowWidth: CGFloat = 560
    static let settingsWindowHeight: CGFloat = 480
    static let settingsModifierPickerWidth: CGFloat = 140
    static let settingsKeyPickerWidth: CGFloat = 100
    static let pillCornerRadius: CGFloat = 6
}

enum CopyTemplate {
    static let portPlaceholder = "{port}"
    static let defaultPortCommand = "PORT={port}"
}
