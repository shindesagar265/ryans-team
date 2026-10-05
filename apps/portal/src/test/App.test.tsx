import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

function renderApp(path = '/') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }

describe('Swimming portal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('action=classes')) return new Response(JSON.stringify({ classes: [], updatedAt: new Date().toISOString() }), { status: 200 });
      return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: null } }), { status: 401 });
    }));
  });

  it('renders the welcome screen from an empty live response', async () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /small classes/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /nothing here yet/i })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('action=classes'))).toBe(true);
  });

  it('renders the empty schedule returned by the live API', async () => {
    renderApp('/schedule');
    expect(await screen.findByRole('heading', { name: /nothing here yet/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated users to live login', async () => {
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
