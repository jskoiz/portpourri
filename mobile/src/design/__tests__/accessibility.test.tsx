import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Button, Card, Chip, Input, StatePanel } from '../primitives';

describe('primitives accessibility', () => {
  describe('Button', () => {
    it('exposes accessibilityRole="button"', () => {
      const { getByRole } = render(<Button label="Join" onPress={() => undefined} />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('exposes accessibilityLabel matching the label prop', () => {
      const { getByLabelText } = render(<Button label="Join BRDG" onPress={() => undefined} />);
      expect(getByLabelText('Join BRDG')).toBeTruthy();
    });

    it('exposes disabled state when disabled', () => {
      const { getByRole } = render(<Button label="Join" onPress={() => undefined} disabled />);
      expect(getByRole('button').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      );
    });

    it('exposes disabled state when loading', () => {
      const { getByRole } = render(<Button label="Join" onPress={() => undefined} loading />);
      expect(getByRole('button').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      );
    });
  });

  describe('Card', () => {
    it('does not expose button role for non-interactive cards', () => {
      const { queryByRole } = render(
        <Card>
          <Text>Content</Text>
        </Card>,
      );
      expect(queryByRole('button')).toBeNull();
    });

    it('exposes accessibilityRole="button" for interactive cards', () => {
      const { getByRole } = render(
        <Card onPress={() => undefined}>
          <Text>Tap me</Text>
        </Card>,
      );
      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('Chip', () => {
    it('exposes accessibilityRole="button" when interactive', () => {
      const { getByRole } = render(<Chip label="Running" onPress={() => undefined} />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('exposes selected state when active', () => {
      const { getByRole } = render(<Chip label="Running" active onPress={() => undefined} />);
      expect(getByRole('button').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      );
    });

    it('exposes accessibilityLabel matching label prop', () => {
      const { getByLabelText } = render(<Chip label="Yoga" onPress={() => undefined} />);
      expect(getByLabelText('Yoga')).toBeTruthy();
    });

    it('uses text role when not interactive', () => {
      const { getByLabelText } = render(<Chip label="Yoga" interactive={false} />);
      const chip = getByLabelText('Yoga');
      expect(chip.props.accessibilityRole).toBe('text');
    });
  });

  describe('Input', () => {
    it('exposes accessibilityLabel from label prop', () => {
      const { getByLabelText } = render(
        <Input label="Email" value="" onChangeText={() => undefined} />,
      );
      expect(getByLabelText('Email')).toBeTruthy();
    });

    it('prefers explicit accessibilityLabel over label prop', () => {
      const { getByLabelText } = render(
        <Input label="Email" accessibilityLabel="Email address" value="" onChangeText={() => undefined} />,
      );
      expect(getByLabelText('Email address')).toBeTruthy();
    });
  });

  describe('StatePanel', () => {
    it('exposes alert role for error panels', () => {
      const { UNSAFE_root } = render(
        <StatePanel title="Error occurred" isError />,
      );
      // The outermost container View should have accessibilityRole="alert"
      const alertView = UNSAFE_root.findAll(
        (node) => node.props.accessibilityRole === 'alert',
      );
      expect(alertView.length).toBeGreaterThan(0);
    });

    it('labels loading indicator with title', () => {
      const { getByLabelText } = render(
        <StatePanel title="Loading data" loading />,
      );
      expect(getByLabelText('Loading: Loading data')).toBeTruthy();
    });
  });
});
