import { PageWrapper } from '~/components/layout/PageWrapper';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { RainbowText } from '~/components/ui/RainbowText';
import AboutContent, { lead } from '~/content/about.mdx';
import type { Route } from './+types/about';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'About - Awesome LED List' },
    { name: 'description', content: 'About the Awesome LED List project' },
  ];
}

export default function About() {
  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'About' }]} />

      <header className="page-header">
        <h1 className="page-title">
          About <RainbowText>Awesome LED List</RainbowText>
        </h1>
      </header>

      <div className="prose">
        <p className="prose-lead">{lead}</p>
        <AboutContent />
      </div>
    </PageWrapper>
  );
}
