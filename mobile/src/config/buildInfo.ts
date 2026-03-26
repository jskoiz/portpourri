import Constants from "expo-constants";

type BuildProvenance = {
  appEnv: string;
  apiBaseUrl: string | null;
  version: string;
  iosBuildNumber: string;
  androidVersionCode: string;
  gitBranch: string;
  gitSha: string;
  gitShortSha: string;
  buildDate: string;
  buildDateSource: "scripted" | "runtime-generated" | "unknown";
  releaseMode: string;
  releaseProfile: string | null;
  provenanceSource: "runtime-derived" | "scripted-release";
};

type ExpoExtra = {
  appEnv?: string;
  apiBaseUrl?: string | null;
  buildProvenance?: Partial<BuildProvenance>;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const provenance = extra.buildProvenance ?? {};

const normalizeString = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRequiredString = (
  ...values: Array<string | null | undefined>
) => {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return "unknown";
};

const normalizeGitSha = (value: string | null | undefined) => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return "unknown";
  }

  return /^[0-9a-f]{7,40}$/i.test(normalized) ? normalized : "unknown";
};

const gitSha = normalizeGitSha(provenance.gitSha);
const normalizedReleaseMode = normalizeString(provenance.releaseMode);
const releaseMode = normalizedReleaseMode ?? "unknown";
const releaseProfile = normalizeString(provenance.releaseProfile);
const hasScriptedReleaseMetadata =
  (normalizedReleaseMode !== null && normalizedReleaseMode !== "runtime") ||
  releaseProfile !== null;

export const buildInfo: BuildProvenance = {
  appEnv: normalizeRequiredString(provenance.appEnv, extra.appEnv),
  apiBaseUrl:
    normalizeString(provenance.apiBaseUrl) ?? normalizeString(extra.apiBaseUrl),
  version:
    normalizeRequiredString(provenance.version, Constants.expoConfig?.version),
  iosBuildNumber: normalizeRequiredString(provenance.iosBuildNumber),
  androidVersionCode: normalizeRequiredString(provenance.androidVersionCode),
  gitBranch: normalizeRequiredString(provenance.gitBranch),
  gitSha,
  gitShortSha:
    normalizeString(provenance.gitShortSha) ??
    (gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7)),
  buildDate: normalizeRequiredString(provenance.buildDate),
  buildDateSource: (() => {
    const src = normalizeString(provenance.buildDateSource);
    return src === "scripted" || src === "runtime-generated" ? src : "unknown";
  })(),
  releaseMode,
  releaseProfile,
  provenanceSource: hasScriptedReleaseMetadata
    ? "scripted-release"
    : "runtime-derived",
};
