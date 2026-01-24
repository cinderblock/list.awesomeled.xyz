import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryNav } from './CategoryNav';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-wrapper">
      <Header />
      <main className="layout-main">{children}</main>
      <CategoryNav />
      <Footer />
    </div>
  );
}
