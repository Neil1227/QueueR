import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PullToRefresh } from '@/components/PullToRefresh';

describe('PullToRefresh Component Tests', () => {
  it('renders children content properly', () => {
    render(
      <PullToRefresh>
        <div data-testid="child-content">Main Card Content</div>
      </PullToRefresh>
    );

    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByText('Main Card Content')).toBeDefined();
    expect(screen.getByText('Pull down to refresh')).toBeDefined();
  });

  it('respects disabled prop without breaking layout', () => {
    render(
      <PullToRefresh disabled={true}>
        <div data-testid="disabled-content">Overlay Active</div>
      </PullToRefresh>
    );

    expect(screen.getByTestId('disabled-content')).toBeDefined();
  });
});
