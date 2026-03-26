function loadBuildInfo(expoConfig: unknown) {
  jest.resetModules();
  jest.doMock("expo-constants", () => ({
    expoConfig,
  }));

  const module = require("../buildInfo");
  return module.buildInfo;
}

describe("buildInfo", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("expo-constants");
  });

  it("reads build provenance from Expo config extra", () => {
    const buildInfo = loadBuildInfo({
      version: "1.0.0",
      extra: {
        appEnv: "production",
        apiBaseUrl: "https://api.brdg.social",
        buildProvenance: {
          appEnv: "production",
          apiBaseUrl: "https://api.brdg.social",
          version: "1.0.0",
          iosBuildNumber: "5",
          androidVersionCode: "5",
          gitBranch: "main",
          gitSha: "abcdef1234567890",
          gitShortSha: "abcdef1",
          buildDate: "2026-03-13T20:00:00.000Z",
          buildDateSource: "scripted",
          releaseMode: "eas",
          releaseProfile: "production",
        },
      },
    });

    expect(buildInfo).toMatchObject({
      appEnv: "production",
      apiBaseUrl: "https://api.brdg.social",
      version: "1.0.0",
      iosBuildNumber: "5",
      androidVersionCode: "5",
      gitBranch: "main",
      gitSha: "abcdef1234567890",
      gitShortSha: "abcdef1",
      buildDate: "2026-03-13T20:00:00.000Z",
      buildDateSource: "scripted",
      releaseMode: "eas",
      releaseProfile: "production",
      provenanceSource: "scripted-release",
    });
  });

  it("falls back to top-level Expo extra when build provenance is missing", () => {
    const buildInfo = loadBuildInfo({
      version: "1.2.3",
      extra: {
        appEnv: "preview",
        apiBaseUrl: "https://preview.brdg.social",
      },
    });

    expect(buildInfo).toMatchObject({
      appEnv: "preview",
      apiBaseUrl: "https://preview.brdg.social",
      version: "1.2.3",
      gitSha: "unknown",
      gitShortSha: "unknown",
      buildDateSource: "unknown",
      releaseMode: "unknown",
      releaseProfile: null,
      provenanceSource: "runtime-derived",
    });
  });

  it("normalizes empty strings and malformed git sha values", () => {
    const buildInfo = loadBuildInfo({
      version: "1.2.3",
      extra: {
        appEnv: " production ",
        apiBaseUrl: "  ",
        buildProvenance: {
          version: " ",
          iosBuildNumber: " ",
          androidVersionCode: "",
          gitBranch: " ",
          gitSha: "not-a-sha",
          gitShortSha: " ",
          buildDate: " ",
          buildDateSource: " ",
          releaseMode: "runtime",
          releaseProfile: " ",
        },
      },
    });

    expect(buildInfo).toMatchObject({
      appEnv: "production",
      apiBaseUrl: null,
      version: "1.2.3",
      iosBuildNumber: "unknown",
      androidVersionCode: "unknown",
      gitBranch: "unknown",
      gitSha: "unknown",
      gitShortSha: "unknown",
      buildDate: "unknown",
      buildDateSource: "unknown",
      releaseMode: "runtime",
      releaseProfile: null,
      provenanceSource: "runtime-derived",
    });
  });
});
