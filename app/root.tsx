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

export const links: Route.LinksFunction = () => [
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

// Inline script to prevent flash of wrong theme on load
const themeScript = `
(function() {
  var theme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = theme === 'dark' || (theme === 'system' && prefersDark) || (!theme && prefersDark);
  document.documentElement.classList.add(isDark ? 'dark' : 'light');
})();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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

  return (
    <main style={{ paddingTop: '4rem', padding: '1rem', maxWidth: '80rem', marginInline: 'auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{message}</h1>
      <p style={{ marginBottom: '1rem' }}>{details}</p>
      {stack && (
        <pre
          style={{
            width: '100%',
            padding: '1rem',
            overflowX: 'auto',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{stack}</code>
        </pre>
      )}
    </main>
  );
}
