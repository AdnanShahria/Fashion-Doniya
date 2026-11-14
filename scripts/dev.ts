const apiProc = Bun.spawn(['bun', '--hot', 'server.ts'], {
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '9998' },
});

const webProc = Bun.spawn(['bunx', 'vite', '--config', 'frontend/vite.config.ts', 'frontend'], {
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
  env: { ...process.env },
});

function shutdown() {
  try {
    apiProc.kill();
    webProc.kill();
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await Promise.race([apiProc.exited, webProc.exited]);
shutdown();

export {};
