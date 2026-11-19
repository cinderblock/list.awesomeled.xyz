import { useEffect, type ReactNode } from 'react';
import { useHydrated } from '~/hooks/useHydrated';
import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryNav } from './CategoryNav';
import { CompareTray } from '../compare/CompareTray';
import { SearchPalette } from '../search/SearchPalette';
import { PixelScrollbar } from '../ui/PixelScrollbar';
import { Toaster } from '../ui/Toaster';
import { TooltipProvider } from '../ui/Tooltip';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Add class to html element to hide native scrollbar
  useEffect(() => {
    document.documentElement.classList.add('has-pixel-scrollbar');
    return () => {
      document.documentElement.classList.remove('has-pixel-scrollbar');
    };
  }, []);

  // The page is prerendered, so it looks ready before it is. Mark the moment
  // React has taken over AND applied what the prerender could not know (the
  // query string, this device's preferences): `hydrated` turns true in the
  // render after hydration, the same one that applies them. End-to-end tests
  // wait for the marker; CSS reveals URL-dependent content on it.
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.hydrated = '';
    // Set by the inline script in root.tsx when the URL carries state
    delete document.documentElement.dataset.urlState;
  }, [hydrated]);

  return (
    <TooltipProvider>
      <div className="layout-wrapper">
        <Header />
        <CategoryNav />
        <main className="layout-main">{children}</main>
        <Footer />
        <PixelScrollbar position="right" pixelSpacing={20} />
        <CompareTray />
        <SearchPalette />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
