const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Log the directory so we can debug on Render
console.log('Serving files from:', ROOT);
console.log('Files in directory:', fs.readdirSync(ROOT).slice(0, 20));
console.log('index.html exists:', fs.existsSync(path.join(ROOT, 'index.html')));

// Serve all static files from the project root
app.use(express.static(ROOT, {
  extensions: ['html'],
  index: 'index.html'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    root: ROOT,
    indexExists: fs.existsSync(path.join(ROOT, 'index.html'))
  });
});

// Fallback — serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(ROOT, 'index.html');
  console.log('Request for:', req.path);
  console.log('Looking for index.html at:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    const files = fs.readdirSync(ROOT).slice(0, 20);
    res.status(404).send(`
      <h1>index.html not found</h1>
      <p>Root: ${ROOT}</p>
      <p>Files in directory: ${files.join(', ')}</p>
      <p>Looking for: ${indexPath}</p>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`E-Hospitee running on port ${PORT}`);
  console.log(`Server root: ${ROOT}`);
});
