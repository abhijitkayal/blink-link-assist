import { useState } from "react";
import { UtensilsCrossed, Droplet, Users as Toilet, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DeviceStatusCard from "@/components/DeviceStatusCard";
import StatusIndicator from "@/components/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";

type ActionType = "food" | "water" | "toilet" | "help" | "emergency";
type StatusType = "idle" | "sending" | "success" | "error";

const Dashboard = () => {
  const [sendingAction, setSendingAction] = useState<ActionType | null>(null);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Play sound for basic needs
  const playSound = (type: string) => {
    const frequencies: { [key: string]: number } = {
      Food: 440, // A4
      Water: 523, // C5
      Toilet: 659, // E5
      Help: 784, // G5
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

    // Get profile data
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");

    try {
      await sendToWebhook({
        type: "need",
        item: `${emoji} ${item}`,
        timestamp: new Date().toISOString(),
        caretaker_name: profileData.caretakerName || "Unknown",
        caretaker_phone: profileData.caretakerPhone || "N/A",
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
        timestamp: new Date().toISOString(),
        patient: {
          name: profileData.name || "Unknown Patient",
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

  return (
    <div className="min-h-screen">
      <Navbar userName="User" isConnected={true} />
      
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
          {/* Device Status Card */}
          <DeviceStatusCard deviceId={import.meta.env.VITE_DEVICE_ID || "esp32-01"} />

          {/* Basic Needs Card */}
          <Card className="border-2 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Basic Needs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => handleBasicNeed("food", "Food", "🍔")}
                disabled={sendingAction === "food"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-food))] text-[hsl(var(--action-food-fg))] border-[hsl(var(--action-food-border))] hover:bg-[hsl(var(--action-food))]/80"
              >
                <UtensilsCrossed className="h-8 w-8" />
                <span className="text-lg font-semibold">Food</span>
              </Button>

              <Button
                onClick={() => handleBasicNeed("water", "Water", "💧")}
                disabled={sendingAction === "water"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-water))] text-[hsl(var(--action-water-fg))] border-[hsl(var(--action-water-border))] hover:bg-[hsl(var(--action-water))]/80"
              >
                <Droplet className="h-8 w-8" />
                <span className="text-lg font-semibold">Water</span>
              </Button>

              <Button
                onClick={() => handleBasicNeed("toilet", "Toilet", "🚽")}
                disabled={sendingAction === "toilet"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-toilet))] text-[hsl(var(--action-toilet-fg))] border-[hsl(var(--action-toilet-border))] hover:bg-[hsl(var(--action-toilet))]/80"
              >
                <Toilet className="h-8 w-8" />
                <span className="text-lg font-semibold">Toilet</span>
              </Button>

              <Button
                onClick={() => handleBasicNeed("help", "Help", "🆘")}
                disabled={sendingAction === "help"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-help))] text-[hsl(var(--action-help-fg))] border-[hsl(var(--action-help-border))] hover:bg-[hsl(var(--action-help))]/80"
              >
                <AlertCircle className="h-8 w-8" />
                <span className="text-lg font-semibold">Help</span>
              </Button>
            </div>
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
