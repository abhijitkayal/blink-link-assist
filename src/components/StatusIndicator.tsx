import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface StatusIndicatorProps {
  status: "idle" | "sending" | "success" | "error";
  message?: string;
}

const StatusIndicator = ({ status, message }: StatusIndicatorProps) => {
  if (status === "idle") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="flex items-center gap-3 rounded-full border bg-card px-5 py-3 shadow-lg">
        {status === "sending" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Sending...</span>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">{message} sent ✓</span>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium">Failed to send ✗</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
