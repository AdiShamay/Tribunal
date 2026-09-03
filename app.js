const path = require('path');
const express = require('express');
const tribunalRoutes = require('./routes/tribunal.routes');
const connectToDatabase = require('./services/database.service');
const {
  createCase,
  getCaseHistory
} = require('./controllers/case.controller');
const { createVerdict } = require('./controllers/verdict.controller');

const app = express();

// Render binds to the dynamic port provided in the PORT environment variable
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- API routes ---
app.use('/api', tribunalRoutes);
app.post('/api/cases', createCase);
app.get('/api/cases', getCaseHistory);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tribunal-backend'
  });
});

app.post('/api/verdict', createVerdict);

// Dedicated 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found'
  });
});

// --- Serve React Frontend static assets ---
// Note: If your client uses Create React App, replace 'dist' with 'build'
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// Catch-all route to serve index.html for client-side routing (SPA)
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Tribunal error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

async function startServer(listenPort = port) {
  // Waiting for MongoDB before accepting requests prevents the API from
  // serving persistence-dependent operations before its datastore is ready.
  await connectToDatabase();
  return app.listen(listenPort);
}

module.exports = app;
module.exports.startServer = startServer;

// Start the server only if this file is run directly (node app.js)
if (require.main === module) {
  startServer().then(() => {
    console.log(`Tribunal server running on port ${port}`);
  }).catch(error => {
    console.error('Failed to connect to database and start server:', error);
    process.exit(1);
  });
}