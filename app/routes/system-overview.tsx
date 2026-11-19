import type { Route } from './+types/system-overview';
import { getCategoryCounts } from '~/lib/data';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';
import { LEDSystemDiagram } from '~/components/diagram/LEDSystemDiagram';
import { DiagramModeToggle, useDiagramMode } from '~/components/diagram/DiagramModeToggle';
import { pageMeta } from '~/lib/meta';

export function meta(_args: Route.MetaArgs) {
  return pageMeta({
    title: 'LED System Overview',
    description:
      'Interactive diagram showing how LED system components connect together - from pattern software through controllers to addressable pixels.',
    path: '/system-overview',
  });
}

export async function loader() {
  const counts = getCategoryCounts();
  return { counts };
}

export default function SystemOverview({ loaderData }: Route.ComponentProps) {
  const { counts } = loaderData;
  const [simpleMode, setSimpleMode] = useDiagramMode();

  return (
    <div className="container page-section system-overview-page">
      <div className="hero-section">
        <h1 className="hero-title">
          <RainbowText>LED System Overview</RainbowText>
        </h1>
        <div className="diagram-intro">
          <p>
            See how different components connect to create a complete addressable LED system. Click
            any component to explore that category.
          </p>
          <div className="diagram-intro-actions">
            <Link to="/designer" className="btn btn--primary">
              Design your own system
            </Link>
            <Link to="/" className="view-toggle-link">
              View as Category Grid
            </Link>
          </div>
        </div>
      </div>

      <div className="diagram-container">
        <DiagramModeToggle value={simpleMode} onChange={setSimpleMode} />
        {/* On a phone the diagram keeps a readable size and scrolls sideways */}
        <div className="diagram-scroll">
          <LEDSystemDiagram counts={counts} simpleMode={simpleMode} />
        </div>
      </div>
    </div>
  );
}
