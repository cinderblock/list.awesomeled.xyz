import { PageWrapper } from '~/components/layout/PageWrapper';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { RainbowText } from '~/components/ui/RainbowText';
import AboutContent, { lead } from '~/content/about.mdx';
import { pageMeta } from '~/lib/meta';
import type { Route } from './+types/about';

export function meta(_args: Route.MetaArgs) {
  return pageMeta({
    title: 'About',
    description:
      'What the Awesome LED List covers, how reliable its data is, where it came from, and how to download all of it.',
    path: '/about',
  });
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
