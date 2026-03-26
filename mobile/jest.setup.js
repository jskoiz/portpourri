jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');
  const React = require('react');
  const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
  const { ThemeProvider } = require('./src/theme/useTheme');

  function createTestClient() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    });
  }

  function withProviders(UserWrapper) {
    const client = createTestClient();

    return function Wrapper({ children }) {
      const wrappedChildren = UserWrapper
        ? React.createElement(UserWrapper, null, children)
        : children;

      return React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(ThemeProvider, null, wrappedChildren),
      );
    };
  }

  const screenProxy = new Proxy(
    {},
    {
      get(_target, prop) {
        const value = actual.screen[prop];
        return typeof value === 'function' ? value.bind(actual.screen) : value;
      },
    },
  );

  return {
    ...actual,
    render: (ui, options = {}) =>
      actual.render(ui, {
        ...options,
        wrapper: withProviders(options.wrapper),
      }),
    renderHook: (callback, options = {}) =>
      actual.renderHook(callback, {
        ...options,
        wrapper: withProviders(options.wrapper),
      }),
    screen: screenProxy,
  };
});

const { cleanup } = require('@testing-library/react-native');
const { notifyManager } = require('@tanstack/query-core');
const { act } = jest.requireActual('@testing-library/react-native');

notifyManager.setNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});

notifyManager.setBatchNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  withScope: jest.fn((callback) =>
    callback({
      setTag: jest.fn(),
      setExtra: jest.fn(),
    }),
  ),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

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

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: React.forwardRef(({ children, ...props }, ref) => (
      <View ref={ref} {...props}>
        {children}
      </View>
    )),
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

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');

  const FlashList = React.forwardRef((props, ref) => <FlatList ref={ref} {...props} />);
  FlashList.displayName = 'FlashList';

  return { FlashList };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return function MockDateTimePicker(props) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => props.onChange?.({ type: 'set' }, new Date(1995, 1, 3, 12, 0, 0, 0))}
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
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
  consoleErrorGuard.mockRestore();
  consoleWarnGuard.mockRestore();
});
