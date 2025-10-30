import { useState } from "react";
import { Phone, Users, UtensilsCrossed, Droplet, Users as Toilet, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DeviceStatusCard from "@/components/DeviceStatusCard";
import StatusIndicator from "@/components/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ActionType = "food" | "water" | "toilet" | "help" | "hospital" | "family";
type StatusType = "idle" | "sending" | "success" | "error";

const Dashboard = () => {
  const [sendingAction, setSendingAction] = useState<ActionType | null>(null);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);

  const sendToWebhook = async (label: string, type: "alert" | "need") => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK;
    
    if (!webhookUrl) {
      console.warn("VITE_N8N_WEBHOOK not configured");
      return;
    }

    try {
      const payload = {
        message: label,
        item: label,
        request: label,
        type,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString(),
      };

      // Simulating webhook call - replace with actual axios call when webhook is configured
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Webhook payload:", payload);
      
      // Uncomment when ready:
      // await axios.post(webhookUrl, payload, {
      //   headers: { "Content-Type": "application/json" },
      // });
      
      return true;
    } catch (error) {
      console.error("Webhook error:", error);
      return false;
    }
  };

  const handleAction = async (action: ActionType, label: string, type: "alert" | "need") => {
    setSendingAction(action);
    setStatus("sending");

    const success = await sendToWebhook(label, type);

    if (success) {
      setStatus("success");
      setStatusMessage(label);
    } else {
      setStatus("error");
    }

    setSendingAction(null);

    // Reset status after 3 seconds
    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 3000);
  };

  const handleEmergency = () => {
    setShowEmergencyOptions(true);
    handleAction("help", "🚨 EMERGENCY 🚨", "alert");
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
                onClick={() => handleAction("food", "🍔 Food", "need")}
                disabled={sendingAction === "food"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-food))] text-[hsl(var(--action-food-fg))] border-[hsl(var(--action-food-border))] hover:bg-[hsl(var(--action-food))]/80"
              >
                <UtensilsCrossed className="h-8 w-8" />
                <span className="text-lg font-semibold">Food</span>
              </Button>

              <Button
                onClick={() => handleAction("water", "💧 Water", "need")}
                disabled={sendingAction === "water"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-water))] text-[hsl(var(--action-water-fg))] border-[hsl(var(--action-water-border))] hover:bg-[hsl(var(--action-water))]/80"
              >
                <Droplet className="h-8 w-8" />
                <span className="text-lg font-semibold">Water</span>
              </Button>

              <Button
                onClick={() => handleAction("toilet", "🚻 Toilet", "need")}
                disabled={sendingAction === "toilet"}
                className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-toilet))] text-[hsl(var(--action-toilet-fg))] border-[hsl(var(--action-toilet-border))] hover:bg-[hsl(var(--action-toilet))]/80"
              >
                <Toilet className="h-8 w-8" />
                <span className="text-lg font-semibold">Toilet</span>
              </Button>

              <Button
                onClick={() => handleAction("help", "🆘 Help", "alert")}
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
            
            {!showEmergencyOptions ? (
              <Button
                onClick={handleEmergency}
                disabled={sendingAction !== null}
                className="w-full h-auto py-8 text-xl font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg animate-pulse-glow hover:animate-none transition-all"
              >
                🚨 EMERGENCY 🚨
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-medium text-muted-foreground mb-4">
                  Emergency alert sent! Choose additional action:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    onClick={() => handleAction("hospital", "🏥 Call Hospital", "alert")}
                    disabled={sendingAction === "hospital"}
                    className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-hospital))] text-[hsl(var(--action-hospital-fg))] border-[hsl(var(--action-hospital-border))] hover:bg-[hsl(var(--action-hospital))]/80"
                  >
                    <Phone className="h-8 w-8" />
                    <span className="text-lg font-semibold">Call Hospital</span>
                  </Button>

                  <Button
                    onClick={() => handleAction("family", "📞 Call Family", "alert")}
                    disabled={sendingAction === "family"}
                    className="action-btn h-auto flex-col gap-3 bg-[hsl(var(--action-family))] text-[hsl(var(--action-family-fg))] border-[hsl(var(--action-family-border))] hover:bg-[hsl(var(--action-family))]/80"
                  >
                    <Users className="h-8 w-8" />
                    <span className="text-lg font-semibold">Call Family</span>
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setShowEmergencyOptions(false)}
                  className="w-full mt-4"
                >
                  Close
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>

      <StatusIndicator status={status} message={statusMessage} />
    </div>
  );
};

export default Dashboard;
