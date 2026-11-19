import { data } from 'react-router';

// Catch-all for addresses no other route matches ("/a/b/c").
//
// The static host serves the app shell for them (404.html, with a 404
// status). Matching here — rather than letting the router find no match at
// all — means the shell hydrates the same way it does for every other page,
// and the loader's 404 then lands in the root error boundary, which renders
// the not-found page with suggestions.
export async function clientLoader() {
  throw data(null, { status: 404 });
}

export default function CatchAll() {
  return null;
}
