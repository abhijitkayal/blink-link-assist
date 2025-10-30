/**
 * Blink Communication System - WebSocket Server
 * 
 * This server provides:
 * - Socket.io WebSocket connections for real-time device communication
 * - REST endpoints for ESP32 heartbeat and blink events
 * - SSE (Server-Sent Events) fallback support
 * 
 * Usage:
 *   npm install express socket.io cors
 *   node server/index.js
 * 
 * Environment:
 *   PORT=8787 (default)
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8787;

// Device state management
const devices = new Map();
const HEARTBEAT_TIMEOUT = 15000; // 15 seconds

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// REST endpoint: ESP32 heartbeat
app.post('/api/heartbeat', (req, res) => {
  const { deviceId, rssi, battery, ts } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const now = Date.now();
  const device = {
    deviceId,
    status: 'online',
    lastSeen: ts || now,
    rssi,
    battery,
    updatedAt: now,
  };

  devices.set(deviceId, device);

  // Broadcast status to all connected clients
  io.emit('status', {
    deviceId,
    status: 'online',
    lastSeen: device.lastSeen,
    transport: 'ws',
  });

  // Emit telemetry if available
  if (rssi !== undefined || battery !== undefined) {
    io.emit('telemetry', {
      deviceId,
      rssi,
      battery,
      timestamp: new Date(device.lastSeen).toISOString(),
    });
  }

  res.json({ success: true, device });
});

// REST endpoint: ESP32 blink event
app.post('/api/blink', (req, res) => {
  const { deviceId, timestamp, blinkCount } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const blinkEvent = {
    deviceId,
    blinkCount: blinkCount || 1,
    timestamp: timestamp || new Date().toISOString(),
  };

  // Broadcast blink count to all connected clients
  io.emit('blinkCount', blinkEvent);

  console.log(`[BLINK] Device ${deviceId} blink count: ${blinkCount}`);

  res.json({ success: true, event: blinkEvent });
});

// REST endpoint: Light control
app.post('/api/light', (req, res) => {
  const { deviceId, command, state } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const lightEvent = {
    deviceId,
    command,
    state,
    timestamp: new Date().toISOString(),
  };

  // Broadcast light command to ESP32
  io.emit('lightCommand', lightEvent);

  console.log(`[LIGHT] Device ${deviceId} light ${state}`);

  res.json({ success: true, event: lightEvent });
});

// n8n webhook proxy endpoint
app.post('/api/trigger-n8n', async (req, res) => {
  try {
    const payload = req.body;
    const n8nWebhook = process.env.VITE_N8N_WEBHOOK || "https://n8n.easykat.info/webhook/netravaani-emergency";
    
    console.log("[n8n] Forwarding payload:", payload);
    
    const response = await axios.post(n8nWebhook, payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("[n8n] Response:", response.data);
    res.json({ success: true, message: "n8n webhook triggered", data: response.data });
  } catch (error) {
    console.error("[n8n] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSE endpoint for fallback
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial status for all devices
  devices.forEach((device) => {
    sendEvent('status', {
      deviceId: device.deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      transport: 'sse',
    });
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Handle client hello
  socket.on('hello', (data) => {
    console.log('[WS] Client hello:', data);
    
    // Send current device statuses
    devices.forEach((device) => {
      socket.emit('status', {
        deviceId: device.deviceId,
        status: device.status,
        lastSeen: device.lastSeen,
        transport: 'ws',
      });
    });
  });

  // Handle light state updates from ESP32
  socket.on('lightStateUpdate', (data) => {
    console.log('[WS] Light state update:', data);
    io.emit('lightState', data);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Background task: Check device timeouts
setInterval(() => {
  const now = Date.now();
  
  devices.forEach((device, deviceId) => {
    const timeSinceUpdate = now - device.updatedAt;
    
    if (timeSinceUpdate > HEARTBEAT_TIMEOUT && device.status === 'online') {
      device.status = 'offline';
      
      io.emit('status', {
        deviceId,
        status: 'offline',
        lastSeen: device.lastSeen,
        transport: 'ws',
      });
      
      console.log(`[TIMEOUT] Device ${deviceId} marked offline`);
    }
  });
}, 5000);

// Periodic status broadcast (every 10 seconds)
setInterval(() => {
  devices.forEach((device) => {
    io.emit('status', {
      deviceId: device.deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      transport: 'ws',
    });
  });
}, 10000);

server.listen(PORT, () => {
  console.log(`[SERVER] Blink Communication Server running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/healthz`);
  console.log(`[SERVER] WebSocket: ws://localhost:${PORT}`);
  console.log(`[SERVER] SSE: http://localhost:${PORT}/sse`);
});
