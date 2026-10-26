import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { fetch as nodeFetch, Headers, Request, Response, FormData } from 'undici';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { resetMockDatabase } from '@/mocks/database';
import { useChatStore } from '@/hooks/useChatStore';

// Use a single fetch realm; Node 24 and jsdom FormData/Request otherwise disagree.
Object.assign(globalThis, {
  Headers,
  Request,
  Response,
  FormData,
  fetch: (input: string | URL | Request, init?: RequestInit) =>
    nodeFetch(
      typeof input === 'string'
        ? new URL(input, window.location.origin)
        : (input as Parameters<typeof nodeFetch>[0]),
      init as Parameters<typeof nodeFetch>[1],
    ),
});
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
window.matchMedia = (query: string) => ({
  matches: query.includes('reduced-motion'),
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
});
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();
export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockDatabase();
  sessionStorage.clear();
  useChatStore.setState({ conversations: [] });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
