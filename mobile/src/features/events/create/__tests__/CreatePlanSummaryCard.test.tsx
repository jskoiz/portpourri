import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme/useTheme';
import { CreatePlanSummaryCard } from '../CreatePlanSummaryCard';

describe('CreatePlanSummaryCard', () => {
  it('shows partial timing progress without counting the step complete yet', () => {
    render(
      <ThemeProvider>
        <CreatePlanSummaryCard
          selectedActivity="Run"
          selectedColor="#8BAA7A"
          selectedTime=""
          selectedWhen="Tomorrow"
          where=""
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Choose timing')).toBeTruthy();
    expect(screen.getByText('Tomorrow / Choose time')).toBeTruthy();
    expect(screen.getByText('1/3')).toBeTruthy();
    expect(screen.getByText('Add location')).toBeTruthy();
  });
});
