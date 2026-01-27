declare module '*.mdx' {
  import type { ComponentType, ReactNode } from 'react';

  const MDXComponent: ComponentType;
  export default MDXComponent;
  export const lead: ReactNode;
}
