const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '0.0.0.0';
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  fs.readFile(HTML_FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading Doctor Portal');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🩺 PillGuardian MD Doctor Portal Server is LIVE!`);
  console.log(`Local Access:   http://localhost:${PORT}`);
  console.log(`Network Access: http://192.168.0.76:${PORT}`);
  console.log(`Open http://192.168.0.76:${PORT} on your second phone or tablet to test!`);
  console.log(`====================================================`);
});
