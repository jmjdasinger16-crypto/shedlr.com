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

/*
 * Legacy pricing existed throughout the static site as:
 *   $19.99 first month, then $39.99/month.
 * Shedlr now uses one simple Growth Plan price: $199/month.
 *
 * Normalize HTML before it leaves the server so customers, search engines,
 * social previews and other crawlers all receive the current pricing even on
 * older static industry pages.
 */
function migratePricing(html) {
  let output = String(html || '');

  const replacements = [
    [/\$19\.99\s+(?:your\s+)?first month,?\s*then\s*\$39\.99\s*(?:per month|\/mo(?:nth)?)/gi, '$199 per month'],
    [/\$19\.99\s+first month,?\s*then\s*\$39\.99\s*(?:per month|\/mo(?:nth)?)/gi, '$199 per month'],
    [/\$19\.99\s+for your first month,?\s*then\s*\$39\.99\s+per month/gi, '$199 per month'],
    [/\$19\.99\s+for the first month,?\s*then\s*\$39\.99\s+per month/gi, '$199 per month'],
    [/Start for\s*\$19\.99/gi, 'Start for $199/month'],
    [/Activate the Growth Plan at\s*\$19\.99\s+for the first month\./gi, 'Activate the Growth Plan at $199 per month.'],
    [/secure checkout for the\s*\$19\.99\s+first month/gi, 'secure checkout for the $199 monthly plan'],
    [/Continue to secure checkout\s*(?:&mdash;|—|-)\s*\$19\.99/gi, 'Continue to secure checkout &mdash; $199/month'],
    [/Renews at\s*\$39\.99\/month after the first month\./gi, 'Renews at $199/month.'],
    [/\$19\.99\s+first month/gi, '$199/month'],
    [/Then\s*<b>\$39\.99\s*\/\s*month<\/b>/gi, '<b>$199 / month</b>'],
    [/Then\s*\$39\.99\s*(?:per month|\/\s*month)/gi, '$199 per month'],
    [/\$19\.99/g, '$199'],
    [/\$39\.99/g, '$199']
  ];

  replacements.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  // Remove legacy introductory-price context after the numeric migration.
  output = output
    .replace(/<dt>First month<\/dt>/gi, '<dt>Monthly plan</dt>')
    .replace(/<dt>Then<\/dt>/gi, '<dt>Monthly price</dt>')
    .replace(/<span>First month<\/span>/gi, '<span>Per month</span>')
    .replace(/\bfirst month\b/gi, 'month')
    .replace(/\bthen\s+\$199\s*(?:per month|\/\s*month)\b/gi, '$199 per month');

  // Structured data should expose the actual monthly price numerically.
  output = output
    .replace(/"price"\s*:\s*"19\.99"/g, '"price":"199"')
    .replace(/"price"\s*:\s*"39\.99"/g, '"price":"199"');

  return output;
}

function sendHtml(res, data) {
  const html = migratePricing(Buffer.isBuffer(data) ? data.toString('utf8') : data);
  res.writeHead(200, htmlHeaders);
  res.end(html);
}

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
        sendHtml(res, data2);
      });
      return;
    }

    const ext = path.extname(filePath);
    if (ext === '.html') {
      sendHtml(res, data);
      return;
    }

    const mime = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': mime });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Shedlr server running on port ${port}`);
});
