import type { RequestListener } from 'node:http';

/**
 * The page lane: a browser hit, not an envelope.
 *
 * The request arrives verbatim — method, target, headers, body — and this
 * response goes back unwrapped, which is the point of the channel: a redirect
 * and a `Set-Cookie` are what a provider callback returns and what a JSON
 * envelope cannot carry.
 */
export const pages: RequestListener = (req, res) => {
  if (!req.url?.startsWith('____route____')) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html' });
  res.end('<h1>____name____</h1>');
};
