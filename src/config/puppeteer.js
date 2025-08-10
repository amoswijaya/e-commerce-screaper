export function getLaunchOptions() {
  const headless = process.env.HEADLESS ?? 'new';
  const args = ['--no-sandbox','--disable-setuid-sandbox'];
  if (process.env.PROXY_URL) args.push(`--proxy-server=${process.env.PROXY_URL}`);
  return { headless, args };
}
