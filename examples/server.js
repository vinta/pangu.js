const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './test-browser.html';
  }

  const extname = path.extname(filePath);
  const contentType =
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
    }[extname] || 'text/plain';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT} in your browser to view the example`);
});
