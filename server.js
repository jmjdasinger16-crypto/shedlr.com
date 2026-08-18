const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const htmlHeaders = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  'pragma': 'no-cache',
  'expires': '0'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Prevent directory traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try serving index.html for SPA-like fallback on .html routes
      const htmlPath = filePath.replace(/\/$/, '') + '.html';
      fs.readFile(htmlPath, (err2, data2) => {
        if (err2) {
          res.writeHead(404, htmlHeaders);
          res.end('<h1>404 — Page not found</h1>');
          return;
        }
        res.writeHead(200, htmlHeaders);
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const headers = ext === '.html'
      ? htmlHeaders
      : { 'content-type': mime };
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Shedlr server running on port ${port}`);
});
