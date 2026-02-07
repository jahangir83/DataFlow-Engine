export function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  process.exit(0);
}
