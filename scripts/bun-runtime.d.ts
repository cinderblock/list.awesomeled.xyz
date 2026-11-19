// Minimal ambient types for the Bun runtime APIs used by scripts that run under
// `bun run` (e.g. scripts/mirror-datasheets.ts). The project doesn't depend on
// @types/bun, so we declare just the surface we use to keep `tsc` happy.

declare module 'bun' {
  interface S3ClientOptions {
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }

  export class S3Client {
    constructor(options: S3ClientOptions);
    write(
      path: string,
      data: Uint8Array | ArrayBuffer | string,
      options?: { type?: string }
    ): Promise<number>;
  }
}

// The Bun global, as used by tests/unit (local mock servers + async subprocesses).
declare namespace Bun {
  interface Server {
    port: number;
    stop(closeActiveConnections?: boolean): void;
  }
  function serve(options: {
    port?: number;
    fetch(req: Request): Response | Promise<Response>;
  }): Server;
  interface Subprocess {
    stdout: ReadableStream<Uint8Array>;
    exited: Promise<number>;
  }
  function spawn(
    cmd: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string | undefined>;
      stdout?: 'pipe' | 'inherit';
    }
  ): Subprocess;
}
