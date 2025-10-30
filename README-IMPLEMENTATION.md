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

### ✅ Profile Management
- Profile dropdown in navbar (top-left)
- Avatar upload & display with base64 storage
- Edit Profile dialog (scrollable) with:
  - Name, Phone, Email, Address
  - Caretaker Name & Phone
  - Avatar image upload
- Medical Details dialog with:
  - Patient ID
  - Hospital Name, Address, Phone
- All data stored in localStorage
- Integrated with emergency & need webhooks

### ✅ Device Status in Navbar
- Real-time device connection indicator in top-right navbar
- 🟢 Green = Connected (animated pulse)
- 🔴 Red = Disconnected
- Tooltip on hover showing connection status
- Updates via WebSocket connection

### ✅ Blink-Based Navigation System
- **1 blink**: Ignored (stabilizing)
- **2 blinks (within 2s)**: Navigate to next menu option
- **3 blinks (within 2s)**: Select current option (triggers webhook)
- **5 blinks (within 3s)**: Trigger emergency alert
- Visual highlighting with ring animation on active menu item
- Audio feedback for navigation and selection
- Auto-reset pointer after selection

### ✅ Basic Needs Buttons
- 🍔 Food (orange pastel) - plays 440Hz tone
- 💧 Water (blue pastel) - plays 523Hz tone
- 🚻 Toilet (purple pastel) - plays 659Hz tone
- 🆘 Help (pink pastel) - plays 784Hz tone
- Visual highlight (ring + scale) for active selection
- Sound feedback via Web Audio API
- Click or blink-based selection
- Includes patient name in webhook payload
- Posts to backend `/api/trigger-n8n` which forwards to n8n
- Sends caretaker info from profile

### ✅ Emergency System
- Single "🚨 EMERGENCY 🚨" button with pulsing animation
- Triggered by clicking button OR 5 blinks within 3 seconds
- Immediately triggers n8n voice agent webhook
- Sends complete patient payload:
  - Patient name, phone, email, address
  - Patient ID
  - Hospital details (name, address, phone)
  - Caretaker details (name, phone)
- Voice agent calls hospital and caretaker automatically
- IST timestamp for Indian timezone
- No secondary buttons needed

### ✅ Light Control
- 💡 Light Control card with toggle button
- Shows "💡 Light ON" (green) or "Light OFF" (red)
- Sends MQTT/REST command to ESP32
- Real-time state updates via WebSocket
- Toast notifications for state changes
- Persistent state tracking

### ✅ Backend Integration
- `/api/trigger-n8n` endpoint - proxies to n8n webhook
- `/api/blink` endpoint - handles blink count events from ESP32
- `/api/light` endpoint - handles light toggle commands
- `/api/heartbeat` endpoint - ESP32 device heartbeats
- WebSocket events: `blinkCount`, `lightCommand`, `lightState`
- Forwards both "need" and "emergency" payloads
- Handles errors gracefully

### ✅ UI/UX
- Soft gradient background (indigo → blue → pink)
- Inter font from Google Fonts
- Responsive design (mobile-first)
- Accessible focus styles
- Loading states with status indicator
- Toast notifications for success/error
- Smooth modal transitions for profile dialogs

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

### Emergency Payload Format

```json
{
  "type": "emergency",
  "timestamp": "2025-10-30 12:34:56 PM IST",
  "patient": {
    "name": "John Doe",
    "phone": "+91XXXXXXXXXX",
    "email": "john@example.com",
    "address": "Block 3, CityCare Apartments",
    "patient_id": "PID12345",
    "hospital_name": "CityCare Hospital",
    "hospital_address": "123 Main St, City",
    "hospital_phone": "+91XXXXXXXXXX",
    "caretaker_name": "Jane Doe",
    "caretaker_phone": "+91XXXXXXXXXX"
  }
}
```

### Basic Need Payload Format

```json
{
  "type": "need",
  "option": "🍔 Food",
  "timestamp": "2025-10-30 12:34:56 PM IST",
  "caretaker_name": "Jane Doe",
  "caretaker_phone": "+91XXXXXXXXXX",
  "patient_name": "John Doe"
}
```

### Blink Count Event (ESP32 → Backend)

ESP32 should POST to `/api/blink`:
```json
{
  "deviceId": "esp32-01",
  "blinkCount": 3,
  "timestamp": "2025-10-30T12:34:56.789Z"
}
```

### Light Control Command (Frontend → ESP32)

Frontend POSTs to `/api/light`, backend emits via WebSocket:
```json
{
  "deviceId": "esp32-01",
  "command": "toggle_light",
  "state": "on" // or "off"
}
```

### Voice Agent Workflow (n8n)

When emergency is triggered, n8n should:
1. Parse patient details from payload
2. Call hospital phone number with voice agent
   - Communicate emergency situation
   - Provide patient details
3. Book ambulance (simulated API call)
4. Call caretaker phone number
   - Inform about emergency
   - Provide status update

### Testing Webhook

Backend server proxies requests to n8n:

```bash
# Test emergency payload
curl -X POST http://localhost:8787/api/trigger-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "timestamp": "2025-10-30T12:00:00Z",
    "patient": {
      "name": "Test Patient",
      "patient_id": "TEST123",
      "hospital_name": "Test Hospital",
      "hospital_phone": "+911234567890",
      "caretaker_name": "Test Caretaker",
      "caretaker_phone": "+910987654321"
    }
  }'

# Test need payload
curl -X POST http://localhost:8787/api/trigger-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "type": "need",
    "item": "💧 Water",
    "timestamp": "2025-10-30T12:00:00Z",
    "caretaker_name": "Test Caretaker",
    "caretaker_phone": "+910987654321"
  }'
```

## ESP32 Integration

### Blink Detection & Navigation

The ESP32 should:
1. **Detect blinks** using EOG (Electrooculography) sensor
2. **Count blinks** in rolling time windows (2-3s)
3. **POST blink counts** to backend at `/api/blink`:

```cpp
// Example ESP32 code snippet
void sendBlinkCount(int count) {
  HTTPClient http;
  http.begin("http://your-server:8787/api/blink");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"deviceId\":\"" + String(DEVICE_ID) + 
                   "\",\"blinkCount\":" + String(count) + 
                   ",\"timestamp\":\"" + getISOTimestamp() + "\"}";
  
  int httpCode = http.POST(payload);
  http.end();
}
```

4. **Listen for light control** commands via WebSocket:

```cpp
// ESP32 subscribes to 'lightCommand' event
// When received, toggle GPIO pin controlling relay
void handleLightCommand(String state) {
  if (state == "on") {
    digitalWrite(LIGHT_PIN, HIGH);
  } else {
    digitalWrite(LIGHT_PIN, LOW);
  }
  
  // Send state confirmation back
  sendLightStateUpdate(state == "on");
}
```

### Blink Navigation Logic (Frontend)

| Blinks | Time Window | Action |
|--------|-------------|--------|
| 1 | - | Ignored (stabilizing) |
| 2 | 2 seconds | Move to next menu option |
| 3 | 2 seconds | Select current option → trigger webhook |
| 5 | 3 seconds | Emergency alert → call hospital & caretaker |

### Testing Blink Events

```bash
# Simulate 2 blinks (navigate)
curl -X POST http://localhost:8787/api/blink \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01","blinkCount":2,"timestamp":"2025-10-30T12:00:00Z"}'

# Simulate 3 blinks (select)
curl -X POST http://localhost:8787/api/blink \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01","blinkCount":3,"timestamp":"2025-10-30T12:00:00Z"}'

# Simulate 5 blinks (emergency)
curl -X POST http://localhost:8787/api/blink \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01","blinkCount":5,"timestamp":"2025-10-30T12:00:00Z"}'
```

See `server/README.md` for complete Arduino sketch examples.

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
- [ ] Profile dropdown opens from navbar
- [ ] Avatar upload and display works
- [ ] Edit Profile form is scrollable
- [ ] Edit Profile form saves to localStorage
- [ ] Medical Details form saves to localStorage
- [ ] Device connection status shows in navbar (🟢/🔴)
- [ ] Device status updates in real-time
- [ ] Blink navigation highlights correct menu item
- [ ] 2 blinks navigates to next option
- [ ] 3 blinks selects current option
- [ ] 5 blinks triggers emergency
- [ ] Navigation sound feedback plays
- [ ] Selection sound feedback plays
- [ ] All action buttons disable during send
- [ ] Status indicator shows sending/success/error
- [ ] Light control toggle changes state
- [ ] Light toggle sends command to backend
- [ ] Emergency button works (click or 5 blinks)
- [ ] Emergency includes all patient data
- [ ] Backend `/api/trigger-n8n` forwards to n8n
- [ ] Backend `/api/blink` handles blink counts
- [ ] Backend `/api/light` handles light control
- [ ] n8n receives correct payload structure
- [ ] Responsive layout on mobile (320px+)
- [ ] Tooltips work on device status
- [ ] No console errors
- [ ] Accessible keyboard navigation

## Next Steps

1. **Fill out profile data** via Profile dropdown
2. **Add medical details** via Medical Details dialog
3. **Start backend server** for real WebSocket connection:
   ```bash
   cd server
   npm install express socket.io cors axios
   node index.js
   ```
4. **Configure n8n webhook** for voice agent automation
5. **Deploy ESP32** with provided Arduino sketch (see server/README.md)
6. **Test emergency flow** end-to-end
7. **Verify sound alerts** work on different browsers

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components
│   ├── Navbar.tsx             # Top navigation with profile dropdown
│   ├── ProfileDropdown.tsx    # Profile menu component
│   ├── EditProfileDialog.tsx  # Profile editing form
│   ├── MedicalDetailsDialog.tsx # Medical info form
│   ├── DeviceStatusCard.tsx   # Connection status & log
│   └── StatusIndicator.tsx    # Toast-like status
├── pages/
│   ├── Dashboard.tsx          # Main app page
│   ├── SignIn.tsx             # Auth page
│   └── SignUp.tsx             # Auth page
├── index.css                  # Design system
└── App.tsx                    # Routes

server/
├── index.js                   # Socket.io server + n8n proxy
└── README.md                  # ESP32 integration guide
```

## Support

For issues or questions:
1. Check console logs for errors
2. Verify environment variables
3. Test backend server health: `curl http://localhost:8787/healthz`
4. Review `server/README.md` for ESP32 setup

## License

MIT
