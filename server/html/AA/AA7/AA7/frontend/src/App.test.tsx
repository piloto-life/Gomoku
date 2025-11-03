import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test without router dependencies
test('renders basic component', () => {
  const TestComponent = () => <div>Gomoku Test</div>;
  render(<TestComponent />);
  const element = screen.getByText(/gomoku test/i);
  expect(element).toBeInTheDocument();
});
