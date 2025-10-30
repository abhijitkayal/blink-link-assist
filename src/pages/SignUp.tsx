import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Clerk key is configured
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!clerkKey) {
      console.warn("VITE_CLERK_PUBLISHABLE_KEY not configured");
    }
  }, []);

  const handleSignUp = () => {
    // Simulate sign up - replace with actual Clerk sign up
    console.log("Sign up clicked - Clerk integration pending");
    // For now, redirect to dashboard to show the UI
    navigate("/dashboard");
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-8 p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Get Started</h1>
          <p className="mt-2 text-muted-foreground">
            Create your Blink Communication account
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Clerk authentication will be configured with your API key
            </p>
          </div>

          <Button
            onClick={handleSignUp}
            className="w-full"
            size="lg"
          >
            Create Account (Demo)
          </Button>

          <div className="text-center">
            <button
              onClick={handleSignIn}
              className="text-sm text-primary hover:underline"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Set <code className="rounded bg-muted px-1 py-0.5">VITE_CLERK_PUBLISHABLE_KEY</code> to enable authentication
        </div>
      </Card>
    </div>
  );
};

export default SignUp;
