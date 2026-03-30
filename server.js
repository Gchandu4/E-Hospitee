const express = require('express');
const path = require('path');
const app = express();

// Serve all static files from the current directory
app.use(express.static(path.join(__dirname)));

// Route all requests to index.html as fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`E-Hospitee running on port ${PORT}`);
});
