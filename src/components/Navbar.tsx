import { Zap } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface NavbarProps {
  userName?: string;
  isConnected?: boolean;
}

const Navbar = ({ userName = "User", isConnected = false }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Profile Dropdown + Logo + Title */}
          <div className="flex items-center gap-3">
            <ProfileDropdown />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">Blink System</span>
          </div>

          {/* Center: Title (hidden on mobile) */}
          <div className="hidden md:block">
            <h1 className="text-base font-medium text-muted-foreground">
              Blink Communication System
            </h1>
          </div>

          {/* Right: Device Connection Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <span className="hidden md:inline text-sm font-medium text-foreground">
                    {isConnected ? "Device Connected" : "Device Disconnected"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isConnected ? "ESP32 Device Connected" : "ESP32 Device Disconnected"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
