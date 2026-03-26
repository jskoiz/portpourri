import type { ExpoConfig } from "expo/config";

declare const __dirname: string;
declare function require(moduleName: string): any;

const { execFileSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const appName = process.env.EXPO_PUBLIC_APP_NAME?.trim() || "BRDG";
const slug = process.env.EXPO_PUBLIC_APP_SLUG?.trim() || "brdg";
const version = process.env.APP_VERSION?.trim() || "1.0.0";
const iosBundleIdentifier =
  process.env.IOS_BUNDLE_IDENTIFIER?.trim() || "com.avmillabs.brdg";
const androidPackage =
  process.env.ANDROID_PACKAGE?.trim() || "com.avmillabs.brdg";

const parsedAndroidVersionCode = Number.parseInt(
  process.env.ANDROID_VERSION_CODE || "1",
  10,
);
const androidVersionCode = Number.isFinite(parsedAndroidVersionCode)
  ? parsedAndroidVersionCode
  : 1;

const appEnv = process.env.APP_ENV?.trim() || "development";
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const iosBuildNumber = process.env.IOS_BUILD_NUMBER?.trim() || "1";

const readGitValue = (
  envKey: string,
  args: string[],
  fallback = "unknown",
) => {
  const explicit = process.env[envKey]?.trim();
  if (explicit) {
    return explicit;
  }

  try {
    const value = String(
      execFileSync("git", ["-C", repoRoot, ...args], {
        stdio: ["ignore", "pipe", "ignore"],
      }),
    )
      .toString()
      .trim();
    return value || fallback;
  } catch {
    return fallback;
  }
};

const gitSha = readGitValue("BRDG_GIT_SHA", ["rev-parse", "HEAD"]);
const gitBranch = readGitValue("BRDG_GIT_BRANCH", ["branch", "--show-current"]);
const configuredBuildDate = process.env.BRDG_BUILD_DATE?.trim();
const buildDate = configuredBuildDate || new Date().toISOString();
const buildDateSource = configuredBuildDate ? "scripted" : "runtime-generated";
const releaseMode = process.env.BRDG_RELEASE_MODE?.trim() || "runtime";

if (appEnv !== "development" && !apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must be set when APP_ENV is preview or production.",
  );
}

const config: ExpoConfig = {
  name: appName,
  slug,
  version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: slug,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  plugins: [
    "expo-asset",
    "expo-font",
    ["expo-image-picker", { "photosPermission": "BRDG needs access to your photos to update your profile picture." }],
    "@sentry/react-native/expo",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "BRDG uses your location to show people nearby and display distances.",
      },
    ],
  ],
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FDFBF8",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
    buildNumber: iosBuildNumber,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "BRDG uses your location to show people nearby and display distances.",
    },
  },
  android: {
    package: androidPackage,
    versionCode: androidVersionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FDFBF8",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    appEnv,
    apiBaseUrl: apiUrl ?? null,
    buildProvenance: {
      appEnv,
      apiBaseUrl: apiUrl ?? null,
      version,
      iosBuildNumber,
      androidVersionCode: String(androidVersionCode),
      gitBranch,
      gitSha,
      gitShortSha: gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7),
      buildDate,
      buildDateSource,
      releaseMode,
      releaseProfile: process.env.BRDG_RELEASE_PROFILE?.trim() || null,
    },
    ...(process.env.EAS_PROJECT_ID
      ? {
          eas: {
            projectId: process.env.EAS_PROJECT_ID,
          },
        }
      : {}),
  },
};

export default config;
