const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Enable CORS
app.use(cors());

// Serve static files from node_modules
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons')));

// Or if you want to serve from a custom directory
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));

app.listen(4000, () => {
    console.log('Server running on port 3000');
});

// Serve axios from node_modules
app.use('/axios', express.static(path.join(__dirname, 'node_modules/axios/dist')));

app.listen(4000, () => {
    console.log('Server running on port 3000');
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/' // Express strips the '/api' mount prefix before this middleware sees req.url, so re-add it
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
        },
        error: (err, req, res) => {
            console.error('[Proxy Error]', err);
            if (res && typeof res.status === 'function') {
                res.status(500).json({
                    error: 'Proxy Error',
                    message: 'Could not connect to backend server'
                });
            } else if (res && typeof res.writeHead === 'function') {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Proxy Error',
                    message: 'Could not connect to backend server'
                }));
            }
        }
    }
}));

// Proxy WebSocket connections for real-time updates
app.use('/socket.io', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true
}));

// Handle SPA routing - serve index.html for all non-api routes
app.get('/*splat', (req, res) => {
    // Don't serve index.html for API routes (they're already handled above)
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🔵 ATC CNS Maintenance System - Frontend Server');
    console.log('='.repeat(60));
    console.log(`📡 Frontend Server: http://localhost:${PORT}`);
    console.log(`🔗 Backend API: ${BACKEND_URL}`);
    console.log(`📋 API Endpoint: http://localhost:${PORT}/api`);
    console.log('='.repeat(60));
    console.log('✅ Server is ready!');
    console.log(`📱 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log('='.repeat(60));
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});