export function createScreenNavigation<T extends object = any>(overrides: Partial<T> = {}) {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    ...overrides,
  } as any as T;
}

export function createScreenRoute<Name extends string, Params = undefined>(
  name: Name,
  params?: Params,
) {
  return {
    key: `${name}-test`,
    name,
    ...(params === undefined ? {} : { params }),
  } as any;
}
