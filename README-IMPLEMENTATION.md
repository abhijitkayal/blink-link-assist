# Blink Communication System - Implementation Guide

## Project Overview

A modern, minimal, responsive web application for ESP32-integrated communication. Users can trigger needs/emergency actions and receive real-time "blink" events from ESP32 devices.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Routing:** React Router DOM 7
- **Auth:** Clerk React (to be configured)
- **HTTP:** Axios
- **Real-time:** Socket.io WebSocket (primary), MQTT/SSE (optional)

## Setup Instructions

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Clerk Authentication (get from clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# WebSocket Server
VITE_WS_URL=http://localhost:8787

# Device ID
VITE_DEVICE_ID=esp32-01

# n8n Webhook
VITE_N8N_WEBHOOK=https://n8n.easykat.info/webhook/netravaani-emergency
```

### 3. Backend Server Setup

```bash
# Install server dependencies
cd server
npm install express socket.io cors

# Start server
node index.js
```

Server runs on **http://localhost:8787**

### 4. Run Frontend

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Features Implemented

### ✅ Device Status Card
- Real-time connection status (Connected/Disconnected)
- Device ID and transport type display
- Live "last seen" timestamp
- Event log with latest 50 blink events
- Dev-only "Test Blink" button
- Pulsing live indicator

### ✅ Basic Needs Buttons
- 🍔 Food (orange pastel)
- 💧 Water (blue pastel)
- 🚻 Toilet (purple pastel)
- 🆘 Help (pink pastel)
- Large, accessible, with hover effects
- Posts to n8n webhook on click

### ✅ Emergency System
- Primary "🚨 EMERGENCY 🚨" button with pulsing animation
- Reveals secondary options:
  - 🏥 Call Hospital (yellow pastel)
  - 📞 Call Family (green pastel)
- All actions POST to configured webhook

### ✅ UI/UX
- Soft gradient background (indigo → blue → pink)
- Inter font from Google Fonts
- Responsive design (mobile-first)
- Accessible focus styles
- Loading states with status indicator
- Toast notifications for success/error

### ✅ Authentication Structure
- Sign In page (`/signin`)
- Sign Up page (`/signup`)
- Protected dashboard route (`/dashboard`)
- Ready for Clerk integration (add API key)

### ✅ Real-time Simulation
- Simulated WebSocket connection
- Automatic blink events every 10-30 seconds
- Live connection status updates
- Event log with timestamps

## WebSocket Integration

### Current State
The frontend simulates WebSocket data. To connect to real ESP32:

1. Start the backend server (see Backend Server Setup)
2. Update frontend to connect to real WebSocket:

```typescript
// In DeviceStatusCard.tsx, replace simulation with:
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_WS_URL);

useEffect(() => {
  socket.on("connect", () => {
    console.log("Connected to server");
    socket.emit("hello", {
      app: "blink-comm",
      version: "1.0.0",
      deviceId: import.meta.env.VITE_DEVICE_ID,
    });
  });

  socket.on("status", (data) => {
    // Update connection status
    setIsConnected(data.status === "online");
    setLastSeen(new Date(data.lastSeen));
  });

  socket.on("blink", (data) => {
    // Add blink event to log
    const newEvent = {
      type: "blink",
      timestamp: data.timestamp,
      message: `Blink from ${data.deviceId}`,
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50));
  });

  return () => socket.disconnect();
}, []);
```

## n8n Webhook Integration

### Payload Format

All actions send this JSON:

```json
{
  "message": "🍔 Food",
  "item": "🍔 Food",
  "request": "🍔 Food",
  "type": "alert" | "need",
  "timestamp": "2025-10-30T12:34:56.789Z",
  "date": "10/30/2025, 12:34:56 PM"
}
```

### Testing Without Webhook

Current implementation simulates the webhook call. To enable real calls:

1. Install axios (already in dependencies)
2. Uncomment axios code in `Dashboard.tsx`:

```typescript
import axios from "axios";

// In sendToWebhook function:
await axios.post(webhookUrl, payload, {
  headers: { "Content-Type": "application/json" },
});
```

## ESP32 Integration

See `server/README.md` for:
- Arduino sketch example
- MQTT alternative setup
- Testing with curl

### Quick Test

```bash
# Simulate blink from ESP32
curl -X POST http://localhost:8787/api/blink \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01"}'
```

## Authentication (Clerk)

### To Enable Full Auth:

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key
4. Add to `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
5. Install Clerk:
   ```bash
   npm install @clerk/clerk-react
   ```
6. Update `App.tsx`:
   ```typescript
   import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
   
   const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
   
   if (!clerkPubKey) {
     throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
   }
   
   const App = () => (
     <ClerkProvider publishableKey={clerkPubKey}>
       {/* Existing app structure */}
     </ClerkProvider>
   );
   ```

## Design System

All colors and styles use semantic tokens from `src/index.css`:

- `--action-food`, `--action-water`, etc. (pastel colors)
- `--gradient-main`, `--gradient-emergency`
- `--status-connected`, `--status-disconnected`
- `--shadow-glow`, `--shadow-card`

**Never use direct color classes!** Always use design system tokens.

## Testing Checklist

- [ ] All routes navigate correctly
- [ ] Device status shows connected/disconnected
- [ ] Last seen updates every second
- [ ] Blink events appear in log
- [ ] Test Blink button works (dev mode)
- [ ] All action buttons disable during send
- [ ] Status indicator shows sending/success/error
- [ ] Emergency button reveals secondary options
- [ ] Responsive layout on mobile (320px+)
- [ ] No console errors
- [ ] Accessible keyboard navigation

## Next Steps

1. **Add Clerk API key** to enable real authentication
2. **Start backend server** for real WebSocket connection
3. **Deploy ESP32** with provided Arduino sketch
4. **Install socket.io-client**:
   ```bash
   npm install socket.io-client
   ```
5. **Connect real WebSocket** (see WebSocket Integration above)
6. **Enable n8n webhook** (uncomment axios code)

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── Navbar.tsx       # Top navigation
│   ├── DeviceStatusCard.tsx  # Connection status & log
│   └── StatusIndicator.tsx   # Toast-like status
├── pages/
│   ├── Dashboard.tsx    # Main app page
│   ├── SignIn.tsx       # Auth page
│   └── SignUp.tsx       # Auth page
├── index.css            # Design system
└── App.tsx              # Routes

server/
├── index.js             # Socket.io server
└── README.md            # ESP32 integration guide
```

## Support

For issues or questions:
1. Check console logs for errors
2. Verify environment variables
3. Test backend server health: `curl http://localhost:8787/healthz`
4. Review `server/README.md` for ESP32 setup

## License

MIT
