// Stub for native Expo modules that can't be resolved by Vite.
// These modules are native-only and have no web implementation.

export const Platform = { OS: 'web', select: (obj: any) => obj.web ?? obj.default };
export class CodedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
export class UnavailabilityError extends Error {
  constructor(moduleName: string, propertyName: string) {
    super(`${moduleName}.${propertyName} is not available on web`);
  }
}
export function requireOptionalNativeModule() { return null; }
export function registerWebModule() {}
export class NativeModule {}

// expo-haptics stubs
export function impactAsync() {}
export function notificationAsync() {}
export function selectionAsync() {}

export default {};
