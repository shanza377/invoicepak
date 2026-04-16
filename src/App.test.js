import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Analytics component
jest.mock('@vercel/analytics/react');

test('renders InvoicePak', () => {
  render(<App />);
  const titleElement = screen.getByText(/InvoicePak/i);
  expect(titleElement).toBeInTheDocument();
});
