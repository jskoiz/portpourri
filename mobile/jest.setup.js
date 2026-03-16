require('@testing-library/jest-native/extend-expect');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  return {
    Image: React.forwardRef((props, ref) => <Image ref={ref} {...props} />),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const createIcon = (displayName) => {
    const Icon = ({ name, testID, ...props }) => (
      <Text accessibilityLabel={name || displayName} testID={testID} {...props}>
        {String(name || displayName)}
      </Text>
    );
    Icon.displayName = displayName;
    return Icon;
  };

  return {
    Feather: createIcon('Feather'),
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');

  const MockBottomSheetModal = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      present: jest.fn(),
      dismiss: jest.fn(),
    }));
    return <View>{props.children}</View>;
  });

  return {
    BottomSheetModalProvider: ({ children }) => <View>{children}</View>,
    BottomSheetModal: MockBottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetScrollView: ({ children, ...props }) => <ScrollView {...props}>{children}</ScrollView>,
    BottomSheetView: ({ children, ...props }) => <View {...props}>{children}</View>,
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return function MockDateTimePicker(props) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => props.onChange?.({ type: 'set' }, new Date('1995-02-03T00:00:00.000Z'))}
      >
        <Text>{props.testID || 'mock-date-picker'}</Text>
      </Pressable>
    );
  };
});

function formatConsoleArgs(args) {
  return args
    .map((value) => {
      if (typeof value === 'string') return value;
      if (value instanceof Error) return value.stack || value.message;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(' ');
}

function createConsoleGuard(method) {
  return jest.spyOn(console, method).mockImplementation((...args) => {
    throw new Error(`Unexpected console.${method}: ${formatConsoleArgs(args)}`);
  });
}

let consoleErrorGuard;
let consoleWarnGuard;

beforeEach(() => {
  consoleErrorGuard = createConsoleGuard('error');
  consoleWarnGuard = createConsoleGuard('warn');
});

afterEach(() => {
  consoleErrorGuard.mockRestore();
  consoleWarnGuard.mockRestore();
});
