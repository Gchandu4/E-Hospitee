const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Log the directory so we can debug on Render
console.log('Serving files from:', ROOT);
console.log('index.html exists:', fs.existsSync(path.join(ROOT, 'index.html')));

// Serve all static files from the project root
app.use(express.static(ROOT));

// Fallback — serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Root: ' + ROOT);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`E-Hospitee running on port ${PORT}`);
});
