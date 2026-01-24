import { useEffect, type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryNav } from './CategoryNav';
import { PixelScrollbar } from '../ui/PixelScrollbar';

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

  return (
    <div className="layout-wrapper">
      <Header />
      <main className="layout-main">{children}</main>
      <CategoryNav />
      <Footer />
      <PixelScrollbar position="right" pixelSpacing={20} />
    </div>
  );
}
