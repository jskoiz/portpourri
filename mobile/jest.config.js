module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|tamagui|@tamagui/.*|@shopify/flash-list|@gorhom/bottom-sheet|@tanstack/react-query))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
