import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminRecover = () => {
  const { session, user, refreshRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRecover = async () => {
    if (!session) {
      toast({ title: "Not logged in", description: "Please log in first.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recover-admin");

      if (error) throw error;

      await refreshRoles();
      setResult(JSON.stringify(data.result, null, 2));
      toast({ title: "Recovery complete", description: "Roles have been updated." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Recovery failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-steel/10">
            <ShieldCheck className="h-6 w-6 text-steel" />
          </div>
          <CardTitle className="font-display text-xl">Admin Recovery</CardTitle>
          <CardDescription>
            Recover super admin access if no admin exists, or restore bootstrap admin roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle size={16} />
              You must be logged in to use this tool.
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Logged in as: <strong>{user?.email}</strong>
              </p>
              <Button
                onClick={handleRecover}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Recover Admin Access
              </Button>
            </>
          )}
          {result && (
            <pre className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-auto">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecover;
