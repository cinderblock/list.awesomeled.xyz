import type { ReactNode } from 'react';

interface CategoryColor {
  hue: number;
}

interface PageWrapperProps {
  children: ReactNode;
  category?: { color: CategoryColor };
  className?: string;
}

export function PageWrapper({ children, category, className }: PageWrapperProps) {
  if (category) {
    return (
      <div
        className="category-theme category-page"
        style={
          {
            '--category-hue': category.color.hue,
            backgroundColor: 'var(--category-bg-subtle)',
          } as React.CSSProperties
        }
      >
        <div className={`container page-section ${className ?? ''}`}>{children}</div>
      </div>
    );
  }

  return (
    <div className="about-page">
      <div className={`container page-section ${className ?? ''}`}>{children}</div>
    </div>
  );
}
