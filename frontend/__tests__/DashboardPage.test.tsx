import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '@/app/dashboard/page';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn()
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  getDatabase: vi.fn(),
  onValue: vi.fn((ref, callback) => {
    callback({ val: () => null });
    return vi.fn();
  })
}));

vi.mock('recharts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  Legend: () => <div />
}));

describe('DashboardPage', () => {
  it('renders without crashing and shows dashboard overview', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });
});
