import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';
import { RainbowProvider } from '~/context/RainbowContext';
import { Layout as AppLayout } from '~/components/layout/Layout';
import { NotFound } from '~/components/search/NotFound';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
  { rel: 'manifest', href: '/site.webmanifest' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

// Inline script to prevent a flash of the wrong theme or table layout on
// load: it runs before first paint and before React, so it applies the
// per-device preferences the prerendered HTML could not know about.
// Keys match lib/prefs.ts (values there are JSON-encoded).
const themeScript = `
(function() {
  var root = document.documentElement;
  var theme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = theme === 'dark' || (theme === 'system' && prefersDark) || (!theme && prefersDark);
  root.classList.add(isDark ? 'dark' : 'light');
  function pref(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  root.dataset.density = pref('awesomeledlist_density') === 'compact' ? 'compact' : 'comfortable';
  // A URL with a query string shows different content than the prerendered
  // HTML (filtered tables, a comparison, search results). Mark the page so
  // CSS can hold that content back until React applies the URL.
  if (location.search.length > 1) root.dataset.urlState = 'pending';
  var view = pref('awesomeledlist_table_view');
  var narrow = window.matchMedia('(max-width: 640px)').matches;
  root.dataset.tableLayout = view === 'cards' || (view !== 'table' && narrow) ? 'cards' : 'table';
})();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#171717" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <RainbowProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RainbowProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  // A missing page gets search suggestions instead of a dead end
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <RainbowProvider>
        <AppLayout>
          <title>Page not found - Awesome LED List</title>
          <meta name="robots" content="noindex" />
          <NotFound />
        </AppLayout>
      </RainbowProvider>
    );
  }

  return (
    <RainbowProvider>
      <AppLayout>
        <div className="container page-section">
          <div className="error-page">
            <h1 className="error-title">{message}</h1>
            <p className="error-message">{details}</p>
            {stack && (
              <pre className="error-stack">
                <code>{stack}</code>
              </pre>
            )}
          </div>
        </div>
      </AppLayout>
    </RainbowProvider>
  );
}
