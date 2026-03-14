require('@testing-library/jest-native/extend-expect');

jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  return {
    Image: React.forwardRef((props, ref) => <Image ref={ref} {...props} />),
  };
});
