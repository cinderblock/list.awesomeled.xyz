import type { Route } from './+types/home';
import { CATEGORIES } from '~/lib/types';
import { getCategoryCounts } from '~/lib/data';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Awesome LED List' },
    {
      name: 'description',
      content: 'A comprehensive database of addressable LEDs, controllers, and related products',
    },
  ];
}

export async function loader() {
  const counts = getCategoryCounts();
  return { counts };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { counts } = loaderData;

  return (
    <div className="container page-section">
      <div className="hero-section">
        <h1 className="hero-title">
          <RainbowText>Awesome LED List</RainbowText>
        </h1>
        <p className="hero-description">
          A comprehensive database of addressable LEDs, controllers, pixels, and related products
          for makers and enthusiasts.
        </p>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            prefetch="intent"
            className="category-card"
            style={{ '--card-hue': category.color.hue } as React.CSSProperties}
          >
            <h2 className="category-card-title">{category.name}</h2>
            <p className="category-card-description">{category.description}</p>
            <span className="category-card-badge">{counts[category.id] || 0} entries</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
