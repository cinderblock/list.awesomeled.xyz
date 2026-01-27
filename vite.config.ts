import mdx from '@mdx-js/rollup';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

function relativeSourcemaps(): Plugin {
  const root = process.cwd();
  return {
    name: 'relative-sourcemaps',
    transform(code, _id) {
      // Only process files with sourcemaps
      if (!code.includes('//# sourceMappingURL=data:')) {
        return null;
      }

      // Extract and modify the inline sourcemap
      const match = code.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.+)$/);
      if (!match) return null;

      try {
        const sourcemap = JSON.parse(Buffer.from(match[1], 'base64').toString());
        if (sourcemap.sources) {
          sourcemap.sources = sourcemap.sources.map((source: string) => {
            // Remove file:// prefix and make relative
            const cleanPath = source.replace(/^file:\/\/\//, '').replace(/^\//, '');
            if (path.isAbsolute(cleanPath)) {
              return path.relative(root, cleanPath);
            }
            return source;
          });
        }
        const newSourcemap = Buffer.from(JSON.stringify(sourcemap)).toString('base64');
        return code.replace(match[0], `//# sourceMappingURL=data:application/json;base64,${newSourcemap}`);
      } catch {
        return null;
      }
    },
  };
}

export default defineConfig({
  plugins: [mdx(), reactRouter(), tsconfigPaths(), relativeSourcemaps()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
          // Make paths relative to the repo root
          const absolutePath = path.resolve(path.dirname(sourcemapPath), relativeSourcePath);
          return path.relative(process.cwd(), absolutePath);
        },
      },
    },
  },
});
