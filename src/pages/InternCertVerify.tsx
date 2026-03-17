import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldX, User, Briefcase, Building2, Calendar, Hash, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function InternCertVerify() {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-intern-direct", certificateId],
    queryFn: async () => {
      // Try internship certificates first — only select public-safe fields
      const { data: intern, error: internErr } = await supabase
        .from("internship_certificates")
        .select("certificate_id, candidate_name, role, organization, start_date, end_date, issue_date, status")
        .eq("certificate_id", certificateId!)
        .maybeSingle();
      if (internErr) throw internErr;
      if (intern) return { type: "internship" as const, data: intern };

      // Fallback to academy certificates — only select public-safe fields
      const { data: academy, error: acadErr } = await supabase
        .from("academy_certificates")
        .select("certificate_number, issued_at, academy_courses(title, instructor_name)")
        .eq("certificate_number", certificateId!)
        .maybeSingle();
      if (acadErr) throw acadErr;
      if (academy) {
        return { type: "academy" as const, data: academy };
      }

      return null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const verificationUrl = `${window.location.origin}/verify/${certificateId}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
        <span className="font-display text-xs font-bold text-primary-foreground">IX</span>
      </div>

      <div className="w-full max-w-lg">
        {data ? (
          data.type === "internship" ? (
            <InternshipCard cert={data.data} url={verificationUrl} />
          ) : (
            <AcademyCard cert={data.data} url={verificationUrl} />
          )
        ) : (
          <Card className="border-destructive/30 bg-card">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">Certificate Not Found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The certificate ID "{certificateId}" could not be verified.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/verify">Try Another ID</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Instruvex. All rights reserved.
      </p>
    </div>
  );
}

function InternshipCard({ cert, url }: { cert: any; url: string }) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const duration = `${new Date(cert.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${new Date(cert.end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

  const rows = [
    { icon: User, label: "Candidate Name", value: cert.candidate_name },
    { icon: Briefcase, label: "Internship Role", value: cert.role },
    { icon: Building2, label: "Organization", value: cert.organization },
    { icon: Calendar, label: "Duration", value: duration },
    { icon: Hash, label: "Certificate ID", value: cert.certificate_id, mono: true },
    { icon: Calendar, label: "Issue Date", value: fmt(cert.issue_date) },
  ];

  return (
    <Card className="border-emerald-500/30 bg-card">
      <CardHeader className="text-center pb-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <Badge className="mx-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✔ Verified Intern</Badge>
        <CardTitle className="mt-3 text-lg">Certificate of Internship</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <r.icon size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className={`text-sm font-semibold text-foreground ${r.mono ? "font-mono" : ""}`}>{r.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-emerald-400 capitalize">{cert.status}</p>
            </div>
          </div>
        </div>
        <QRSection url={url} />
      </CardContent>
    </Card>
  );
}

function AcademyCard({ cert, url }: { cert: any; url: string }) {
  const course = cert.academy_courses as any;
  const name = cert.profile
    ? `${cert.profile.first_name || ""} ${cert.profile.last_name || ""}`.trim() || cert.profile.email
    : "Unknown User";

  return (
    <Card className="border-emerald-500/30 bg-card">
      <CardHeader className="text-center pb-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <Badge className="mx-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Verified Certificate</Badge>
        <CardTitle className="mt-3 text-lg">Certificate of Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <Row icon={User} label="Awarded To" value={name} />
          <Row icon={Briefcase} label="Course" value={course?.title || "Unknown Course"} />
          <Row icon={Calendar} label="Issued On" value={new Date(cert.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          <Row icon={Hash} label="Certificate ID" value={cert.certificate_number} mono />
        </div>
        <QRSection url={url} />
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function QRSection({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">Scan to verify</p>
      <div className="rounded-lg bg-white p-3">
        <QRCodeSVG value={url} size={120} level="H" />
      </div>
      <p className="max-w-full truncate text-[10px] text-muted-foreground">{url}</p>
    </div>
  );
}
