import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Plus, ShieldCheck, ExternalLink, Copy, Loader2, Award, Search } from "lucide-react";

export default function CertificationsAdmin() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    candidate_name: "",
    role: "",
    start_date: "",
    end_date: "",
    issue_date: new Date().toISOString().split("T")[0],
  });

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["admin-intern-certs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_certificates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("internship_certificates").insert({
        candidate_name: form.candidate_name.trim(),
        role: form.role.trim(),
        organization: "Instruvex",
        start_date: form.start_date,
        end_date: form.end_date,
        issue_date: form.issue_date,
        created_by: session!.user.id,
        certificate_id: "", // trigger will auto-generate
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-intern-certs"] });
      setOpen(false);
      setForm({ candidate_name: "", role: "", start_date: "", end_date: "", issue_date: new Date().toISOString().split("T")[0] });
      toast({ title: "Certificate created", description: "Internship certificate has been issued." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredCerts = certs.filter(
    (c: any) =>
      c.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      c.certificate_id.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (certId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${certId}`);
    toast({ title: "Link copied" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Certifications</h1>
            <p className="text-sm text-muted-foreground">Manage internship certificates</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Issue Certificate</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Issue Internship Certificate</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Candidate Name</Label>
                  <Input required value={form.candidate_name} onChange={(e) => setForm((p) => ({ ...p, candidate_name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Internship Role</Label>
                  <Input required value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="AI Intern" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" required value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" required value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" required value={form.issue_date} onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} />
                </div>
                <p className="text-xs text-muted-foreground">Certificate ID will be auto-generated (e.g. INS-INT-2026-000001)</p>
                <Button type="submit" className="w-full" disabled={createMut.isPending}>
                  {createMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                  <span className="ml-2">Issue Certificate</span>
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{certs.length}</p><p className="text-xs text-muted-foreground">Total Certificates</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-400">{certs.filter((c: any) => c.status === "verified").length}</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{certs.filter((c: any) => c.status === "revoked").length}</p><p className="text-xs text-muted-foreground">Revoked</p></CardContent></Card>
        </div>

        {/* Search + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Search size={16} className="text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredCerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No certificates found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCerts.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.certificate_id}</TableCell>
                        <TableCell className="font-medium">{c.candidate_name}</TableCell>
                        <TableCell>{c.role}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(c.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – {new Date(c.end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <Badge className={c.status === "verified" ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => copyLink(c.certificate_id)} title="Copy verification link">
                              <Copy size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" asChild title="Open verification page">
                              <a href={`/verify/${c.certificate_id}`} target="_blank" rel="noreferrer">
                                <ExternalLink size={14} />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
