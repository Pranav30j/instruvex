import { useState, useEffect } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Bell, Palette, Save, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  instructor: "Instructor",
  student: "Student",
  academy_learner: "Academy Learner",
};

const Settings = () => {
  const { user, profile, roles, activeRole, switchRole } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [resultAlerts, setResultAlerts] = useState(true);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) throw error;
      toast({ title: "Email sent", description: "Check your inbox for a password reset link." });
    } catch {
      toast({ title: "Error", description: "Failed to send reset email.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSwitch = (role: string) => {
    switchRole(role as AppRole);
    toast({ title: "Role switched", description: `Now viewing as ${ROLE_LABELS[role as AppRole]}` });
  };

  const initials = firstName ? `${firstName[0]}${lastName?.[0] || ""}`.toUpperCase() : "U";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile" className="gap-2"><User size={14} /> Profile</TabsTrigger>
            <TabsTrigger value="roles" className="gap-2"><RefreshCw size={14} /> Switch Role</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield size={14} /> Security</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell size={14} /> Notifications</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2"><Palette size={14} /> Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">{initials}</div>
                  <div>
                    <p className="font-medium text-foreground">{firstName} {lastName}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
                <Separator className="bg-border" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Switch Role Tab */}
          <TabsContent value="roles">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Switch Active Role</CardTitle>
                <CardDescription>
                  You have {roles.length} role{roles.length !== 1 ? "s" : ""} assigned. Switch your active role to change your dashboard and available features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Active Role</Label>
                  <Select value={activeRole || ""} onValueChange={handleRoleSwitch}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-border" />
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Your Assigned Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <span
                        key={role}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          role === activeRole
                            ? "bg-steel/20 text-steel ring-1 ring-steel/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ROLE_LABELS[role]}
                        {role === activeRole && " (Active)"}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                  <p className="text-sm text-muted-foreground">We'll send a password reset link to your email address.</p>
                  <Button variant="outline" onClick={handleChangePassword} disabled={saving} className="mt-2">
                    {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                    Send Reset Link
                  </Button>
                </div>
                <Separator className="bg-border" />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">You are currently signed in on this device.</p>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-foreground">Current Session</p>
                    <p className="text-xs text-muted-foreground">Last active: Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Email Notifications", desc: "Receive updates via email", value: emailNotifications, setter: setEmailNotifications },
                  { label: "Exam Reminders", desc: "Get reminded before exam deadlines", value: examReminders, setter: setExamReminders },
                  { label: "Result Alerts", desc: "Be notified when results are available", value: resultAlerts, setter: setResultAlerts },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">Currently using the dark theme. More themes coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
