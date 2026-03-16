import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Award, Calendar, User, BookOpen } from "lucide-react";

export default function CertificateVerify() {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-certificate", certificateId],
    queryFn: async () => {
      const { data: cert, error: certErr } = await supabase
        .from("academy_certificates")
        .select("*, academy_courses(*)")
        .eq("certificate_number", certificateId!)
        .single();
      if (certErr) throw certErr;

      // Get profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", cert.user_id)
        .single();

      return { ...cert, profile };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/30 bg-card">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Award className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Certificate Not Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The certificate ID "{certificateId}" could not be verified. Please check the ID and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const course = data.academy_courses as any;
  const name = data.profile
    ? `${data.profile.first_name || ""} ${data.profile.last_name || ""}`.trim() || data.profile.email
    : "Unknown User";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-emerald-500/30 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <Badge className="mx-auto bg-emerald-500/20 text-emerald-400">Verified Certificate</Badge>
          <CardTitle className="mt-3 text-xl">Certificate of Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Awarded To</p>
                <p className="text-sm font-semibold text-foreground">{name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="text-sm font-semibold text-foreground">{course?.title || "Unknown Course"}</p>
                {course?.instructor_name && (
                  <p className="text-xs text-muted-foreground">by {course.instructor_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Issued On</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(data.issued_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Certificate ID</p>
                <p className="text-sm font-mono font-semibold text-foreground">{data.certificate_number}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            This certificate verifies that the above individual has successfully completed the course and passed the final certification exam on the Instruvex Academy platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
