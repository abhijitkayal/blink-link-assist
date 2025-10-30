import { useState, useEffect } from "react";
import { UtensilsCrossed, Droplet, Users as Toilet, AlertCircle, Lightbulb } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusIndicator from "@/components/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

type ActionType = "food" | "water" | "toilet" | "help" | "emergency" | "light";
type StatusType = "idle" | "sending" | "success" | "error";

interface BasicNeed {
  id: ActionType;
  label: string;
  icon: any;
  emoji: string;
}

const Dashboard = () => {
  const [sendingAction, setSendingAction] = useState<ActionType | null>(null);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkTimer, setBlinkTimer] = useState<NodeJS.Timeout | null>(null);
  const [lightState, setLightState] = useState(false);

  const basicNeeds: BasicNeed[] = [
    { id: "food", label: "Food", icon: UtensilsCrossed, emoji: "🍔" },
    { id: "water", label: "Water", icon: Droplet, emoji: "💧" },
    { id: "toilet", label: "Toilet", icon: Toilet, emoji: "🚽" },
    { id: "help", label: "Help", icon: AlertCircle, emoji: "🆘" },
  ];

  // WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    const deviceId = import.meta.env.VITE_DEVICE_ID || "esp32-01";
    const newSocket = io(wsUrl, {
      query: { deviceId },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("hello", { app: "blink-comm", version: "1.0.0", deviceId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Handle blink count events from ESP32
    newSocket.on("blinkCount", (data: { deviceId: string; blinkCount: number; timestamp: string }) => {
      if (data.deviceId === deviceId) {
        handleBlinkEvent(data.blinkCount);
      }
    });

    // Handle light state updates
    newSocket.on("lightState", (data: { deviceId: string; state: boolean }) => {
      if (data.deviceId === deviceId) {
        setLightState(data.state);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle blink events based on count
  const handleBlinkEvent = (count: number) => {
    setBlinkCount(count);

    // Clear existing timer
    if (blinkTimer) {
      clearTimeout(blinkTimer);
    }

    // 1 blink = ignored (stabilizing)
    if (count === 1) {
      const timer = setTimeout(() => setBlinkCount(0), 2000);
      setBlinkTimer(timer);
      return;
    }

    // 2 blinks within 2s = move to next menu
    if (count === 2) {
      setActiveMenuIndex((prev) => (prev + 1) % basicNeeds.length);
      playSound("navigate");
      toast({
        title: "Navigated",
        description: `Selected: ${basicNeeds[(activeMenuIndex + 1) % basicNeeds.length].label}`,
        duration: 1500,
      });
      const timer = setTimeout(() => setBlinkCount(0), 2000);
      setBlinkTimer(timer);
      return;
    }

    // 3 blinks within 2s = select current option
    if (count === 3) {
      const selected = basicNeeds[activeMenuIndex];
      handleBasicNeed(selected.id, selected.label, selected.emoji);
      const timer = setTimeout(() => {
        setBlinkCount(0);
        setActiveMenuIndex(0); // Reset to first option after selection
      }, 2000);
      setBlinkTimer(timer);
      return;
    }

    // 5 blinks within 3s = trigger emergency
    if (count === 5) {
      handleEmergency();
      const timer = setTimeout(() => setBlinkCount(0), 3000);
      setBlinkTimer(timer);
      return;
    }

    // Reset for other counts
    const timer = setTimeout(() => setBlinkCount(0), 3000);
    setBlinkTimer(timer);
  };

  // Play sound for basic needs
  const playSound = (type: string) => {
    const frequencies: { [key: string]: number } = {
      Food: 440, // A4
      Water: 523, // C5
      Toilet: 659, // E5
      Help: 784, // G5
      navigate: 350, // F4
      select: 600, // D5
    };

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequencies[type] || 440;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Send to backend n8n proxy
  const sendToWebhook = async (payload: any) => {
    const backendUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    await axios.post(`${backendUrl}/api/trigger-n8n`, payload);
  };

  const handleBasicNeed = async (action: ActionType, item: string, emoji: string) => {
    setSendingAction(action);
    setStatus("sending");

    // Play sound
    playSound(item);
    playSound("select"); // Confirmation sound

    // Get profile data
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");

    try {
      await sendToWebhook({
        type: "need",
        option: `${emoji} ${item}`,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        caretaker_name: profileData.caretakerName || "Unknown",
        caretaker_phone: profileData.caretakerPhone || "N/A",
        patient_name: profileData.name || "Unknown Patient",
      });
      setStatus("success");
      setStatusMessage(item);
    } catch (error) {
      console.error("Failed to send:", error);
      setStatus("error");
    }

    setSendingAction(null);

    // Reset status after 2 seconds
    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 2000);
  };

  const handleEmergency = async () => {
    setSendingAction("emergency");
    setStatus("sending");

    // Get profile and medical data
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");
    const medicalData = JSON.parse(localStorage.getItem("medicalData") || "{}");

    try {
      await sendToWebhook({
        type: "emergency",
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        patient: {
          name: profileData.name || "Unknown Patient",
          phone: profileData.phone || "N/A",
          email: profileData.email || "N/A",
          address: profileData.address || "N/A",
          patient_id: medicalData.patientId || "N/A",
          hospital_name: medicalData.hospitalName || "Unknown Hospital",
          hospital_address: medicalData.hospitalAddress || "N/A",
          hospital_phone: medicalData.hospitalPhone || "N/A",
          caretaker_name: profileData.caretakerName || "Unknown",
          caretaker_phone: profileData.caretakerPhone || "N/A",
        },
      });
      setStatus("success");
      setStatusMessage("Emergency");
    } catch (error) {
      console.error("Failed to send emergency:", error);
      setStatus("error");
    }

    setSendingAction(null);

    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 2000);
  };

  const handleLightToggle = async () => {
    const newState = !lightState;
    setLightState(newState);

    // Send to backend/ESP32
    try {
      const backendUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
      await axios.post(`${backendUrl}/api/light`, {
        deviceId: import.meta.env.VITE_DEVICE_ID || "esp32-01",
        command: "toggle_light",
        state: newState ? "on" : "off",
      });

      toast({
        title: newState ? "Light Turned ON" : "Light Turned OFF",
        description: `Light is now ${newState ? "on" : "off"}`,
      });
    } catch (error) {
      console.error("Failed to toggle light:", error);
      setLightState(!newState); // Revert on error
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar userName="User" isConnected={isConnected} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground md:text-5xl">
            Blink Communication System
          </h1>
          <p className="text-lg italic text-muted-foreground">
            Your voice, simplified ⚡
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Needs Card */}
          <Card className="border-2 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Basic Needs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {basicNeeds.map((need, index) => {
                const Icon = need.icon;
                const isActive = index === activeMenuIndex;
                return (
                  <Button
                    key={need.id}
                    onClick={() => handleBasicNeed(need.id, need.label, need.emoji)}
                    disabled={sendingAction === need.id}
                    className={`action-btn h-auto flex-col gap-3 transition-all duration-300 ${
                      isActive
                        ? "ring-4 ring-primary ring-offset-2 scale-105 shadow-xl"
                        : ""
                    } bg-[hsl(var(--action-${need.id}))] text-[hsl(var(--action-${need.id}-fg))] border-[hsl(var(--action-${need.id}-border))] hover:bg-[hsl(var(--action-${need.id}))]/80`}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="text-lg font-semibold">{need.label}</span>
                    {isActive && (
                      <span className="text-xs font-normal opacity-70">← Selected</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Light Control Card */}
          <Card className="border-2 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Light Control</h2>
            <Button
              onClick={handleLightToggle}
              className={`w-full h-auto py-8 text-xl font-bold rounded-xl shadow-lg transition-all ${
                lightState
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <Lightbulb className="h-8 w-8 mr-3" />
              {lightState ? "💡 Light ON" : "Light OFF"}
            </Button>
          </Card>

          {/* Emergency Card */}
          <Card className="border-2 border-red-200 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Emergency</h2>
            
            <Button
              onClick={handleEmergency}
              disabled={sendingAction !== null}
              className="w-full h-auto py-8 text-xl font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg animate-pulse-glow hover:animate-none transition-all"
            >
              🚨 EMERGENCY 🚨
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Triggers voice agent to call hospital & caretaker
            </p>
          </Card>
        </div>
      </main>

      <StatusIndicator status={status} message={statusMessage} />
    </div>
  );
};

export default Dashboard;
