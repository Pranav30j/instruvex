import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type CallbackStatus = "processing" | "success" | "error";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // First, let Supabase exchange the hash/query tokens for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        // exchangeCodeForSession may fail if it's a hash-based flow (implicit),
        // so fall back to getSession which handles hash tokens automatically
        if (exchangeError) {
          console.log("Code exchange not applicable, trying getSession:", exchangeError.message);
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error.message);
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          console.log("User logged in:", data.session.user.email);
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 800);
          return;
        }

        // No session yet — listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            console.log("Auth state changed — signed in:", session.user.email);
            setStatus("success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 800);
            subscription.unsubscribe();
          }
        });

        // Timeout after 8 seconds
        setTimeout(() => {
          setStatus((prev) => {
            if (prev === "processing") {
              subscription.unsubscribe();
              return "error";
            }
            return prev;
          });
          setErrorMsg("Verification timed out. Please try logging in again.");
        }, 8000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card-gradient p-8 shadow-card text-center">
        {status === "processing" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-steel mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Signing you in...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your identity.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Login successful!</h1>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground mb-2">Login failed</h1>
            <p className="text-sm text-muted-foreground mb-4">{errorMsg || "The link may have expired."}</p>
            <a href="/login" className="text-steel hover:underline text-sm">Go to Login</a>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
