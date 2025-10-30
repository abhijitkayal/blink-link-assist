import { Zap } from "lucide-react";

interface NavbarProps {
  userName?: string;
  isConnected?: boolean;
}

const Navbar = ({ userName = "User", isConnected = false }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-2">
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

          {/* Right: User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{userName}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {isConnected ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            
            {/* Mobile: Just status indicator */}
            <div className="md:hidden">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
