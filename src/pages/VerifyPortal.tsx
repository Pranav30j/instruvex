import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShieldCheck, ShieldX, Award, User, Briefcase, Building2, Calendar, Hash, Loader2,
} from "lucide-react";

export default function VerifyPortal() {
  const [certInput, setCertInput] = useState("");
  const [searchId, setSearchId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, error, isFetched } = useQuery({
    queryKey: ["verify-intern", searchId],
    enabled: !!searchId,
    queryFn: async () => {
      const id = searchId!.trim();
      const { data: cert, error: err } = await supabase
        .from("internship_certificates")
        .select("*")
        .eq("certificate_id", id)
        .maybeSingle();
      if (err) throw err;
      return cert;
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certInput.trim()) setSearchId(certInput.trim());
  };

  const verificationUrl = data
    ? `${window.location.origin}/verify/${data.certificate_id}`
    : "";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      {/* Logo */}
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-steel to-cyan-accent">
        <span className="font-display text-lg font-bold text-primary-foreground">IX</span>
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
        Certificate Verification Portal
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Verify the authenticity of Instruvex-issued certificates
      </p>

      {/* Search form */}
      <form onSubmit={handleVerify} className="mt-8 flex w-full max-w-md gap-2">
        <Input
          placeholder="Enter Certificate ID (e.g. INS-INT-2026-000001)"
          value={certInput}
          onChange={(e) => setCertInput(e.target.value)}
          className="h-11"
        />
        <Button type="submit" disabled={isLoading || !certInput.trim()} className="h-11 gap-2">
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Verify
        </Button>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isFetched && searchId && (
          <motion.div
            key={data ? "found" : "not-found"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 w-full max-w-lg"
          >
            {data ? (
              <VerifiedCard cert={data} verificationUrl={verificationUrl} />
            ) : (
              <InvalidCard searchId={searchId} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-12 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Instruvex. All rights reserved.
      </p>
    </div>
  );
}

function VerifiedCard({ cert, verificationUrl }: { cert: any; verificationUrl: string }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const duration = `${new Date(cert.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${new Date(cert.end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

  const rows = [
    { icon: User, label: "Candidate Name", value: cert.candidate_name },
    { icon: Briefcase, label: "Internship Role", value: cert.role },
    { icon: Building2, label: "Organization", value: cert.organization },
    { icon: Calendar, label: "Duration", value: duration },
    { icon: Hash, label: "Certificate ID", value: cert.certificate_id, mono: true },
    { icon: Calendar, label: "Issue Date", value: formatDate(cert.issue_date) },
  ];

  return (
    <Card className="border-emerald-500/30 bg-card overflow-hidden">
      <CardHeader className="text-center pb-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
        >
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <Badge className="mx-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          ✔ Verified Intern
        </Badge>
        <CardTitle className="mt-3 text-lg">Certificate of Internship</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <r.icon size={16} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className={`text-sm font-semibold text-foreground ${r.mono ? "font-mono" : ""}`}>
                  {r.value}
                </p>
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

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Scan to verify</p>
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG value={verificationUrl} size={120} level="H" />
          </div>
          <p className="max-w-full truncate text-[10px] text-muted-foreground">{verificationUrl}</p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This certificate verifies that the above individual has successfully completed an internship at Instruvex.
        </p>
      </CardContent>
    </Card>
  );
}

function InvalidCard({ searchId }: { searchId: string }) {
  return (
    <Card className="border-destructive/30 bg-card">
      <CardContent className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
        >
          <ShieldX className="h-8 w-8 text-destructive" />
        </motion.div>
        <h2 className="font-display text-xl font-bold text-foreground">Invalid Certificate</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The certificate ID "{searchId}" is not valid or does not exist in our records.
        </p>
      </CardContent>
    </Card>
  );
}
