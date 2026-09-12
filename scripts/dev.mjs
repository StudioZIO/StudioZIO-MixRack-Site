import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import './build.mjs';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  let candidate = normalize(join(root, pathname));
  if (!candidate.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if (statSync(candidate).isDirectory()) candidate = join(candidate, 'index.html');
    if (!statSync(candidate).isFile()) throw new Error('Not a file');
  } catch {
    candidate = join(root, '404.html');
    response.statusCode = 404;
  }
  response.setHeader('Content-Type', contentTypes[extname(candidate)] || 'application/octet-stream');
  createReadStream(candidate).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`StudioZIO website preview: http://127.0.0.1:${port}`);
});
