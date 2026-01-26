import type { Route } from './+types/system-overview';
import { useNavigate } from 'react-router';
import { CATEGORIES } from '~/lib/types';
import { getCategoryCounts } from '~/lib/data';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';
import { LEDSystemDiagram } from '~/components/diagram/LEDSystemDiagram';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'LED System Overview - Awesome LED List' },
    {
      name: 'description',
      content:
        'Interactive diagram showing how LED system components connect together - from pattern software through controllers to addressable pixels.',
    },
  ];
}

export async function loader() {
  const counts = getCategoryCounts();
  return { counts };
}

export default function SystemOverview({ loaderData }: Route.ComponentProps) {
  const { counts } = loaderData;
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      navigate(category.path);
    }
  };

  return (
    <div className="container page-section system-overview-page">
      <div className="hero-section">
        <h1 className="hero-title">
          <RainbowText>LED System Overview</RainbowText>
        </h1>
        <div className="diagram-intro">
          <p>
            See how different components connect to create a complete addressable LED system.
            Click any component to explore that category.
          </p>
          <Link to="/" className="view-toggle-link">
            View as Category Grid
          </Link>
        </div>
      </div>

      <div className="diagram-container">
        <LEDSystemDiagram counts={counts} onCategoryClick={handleCategoryClick} />
      </div>
    </div>
  );
}
