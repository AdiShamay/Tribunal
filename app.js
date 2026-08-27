const express = require('express');
const tribunalRoutes = require('./routes/tribunal.routes');
const connectToDatabase = require('./services/database.service');
const { createCase } = require('./controllers/case.controller');
const { createVerdict } = require('./controllers/verdict.controller');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use('/api', tribunalRoutes);
app.post('/api/cases', createCase);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tribunal-backend'
  });
});

app.post('/api/verdict', createVerdict);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
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