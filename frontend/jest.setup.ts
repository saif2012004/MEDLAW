import '@testing-library/jest-dom';
import React from 'react';

// Basic window APIs missing in JSDOM
if (!global.matchMedia) {
  // @ts-expect-error - jsdom partial implementation
  global.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!global.IntersectionObserver) {
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  // @ts-expect-error - jsdom global extension
  global.IntersectionObserver = MockIntersectionObserver;
}

// Router mocks for Next.js
const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  __esModule: true,
  __routerMock: routerMock,
}));

jest.mock('next/link', () => {
  return function Link({ children, href, ...rest }: any) {
    return React.createElement('a', { href: typeof href === 'string' ? href : '#', ...rest }, children);
  };
});

// Stub gsap to avoid DOM/scroll dependencies in tests
jest.mock('gsap', () => {
  const gsap = {
    registerPlugin: jest.fn(),
    fromTo: jest.fn(),
    timeline: jest.fn(() => ({ to: jest.fn(), fromTo: jest.fn() })),
  };
  return gsap;
});

jest.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

// Provide a default fetch mock; individual tests can override
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
}) as any;

