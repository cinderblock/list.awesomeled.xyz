import { Link } from 'react-router';

export interface BreadcrumbItem {
  label: React.ReactNode;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  categoryThemed?: boolean;
}

export function Breadcrumb({ items, categoryThemed = false }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const currentClass = categoryThemed ? 'category-breadcrumb-current' : 'breadcrumb-current';

        return (
          <span key={index} style={{ display: 'contents' }}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {item.path && !isLast ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? currentClass : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
