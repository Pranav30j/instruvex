import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Clock, Users, MoreVertical, Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type Exam = Tables<"exams">;

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-steel/20 text-steel",
  active: "bg-success/20 text-success",
  completed: "bg-warning/20 text-warning",
  archived: "bg-muted text-muted-foreground",
};

const ExamList = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setExams(data);
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
    } else {
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Exam deleted" });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Examinations</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your exams</p>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/dashboard/exams/create"><Plus size={18} /> Create Exam</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={48} className="text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">No exams yet</h2>
          <p className="text-muted-foreground mb-6">Create your first exam to get started</p>
          <Button asChild variant="hero">
            <Link to="/dashboard/exams/create"><Plus size={18} /> Create Exam</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-xl border border-border bg-card-gradient p-5 shadow-card transition-all hover:border-steel/30">
              <div className="flex items-start justify-between mb-3">
                <Badge className={statusColor[exam.status] || ""}>{exam.status}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground"><MoreVertical size={16} /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/exams/${exam.id}/edit`}><Pencil size={14} className="mr-2" /> Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/exams/${exam.id}`}><Eye size={14} className="mr-2" /> View</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteExam(exam.id)} className="text-destructive">
                      <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link to={`/dashboard/exams/${exam.id}`}>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 hover:text-steel transition-colors">{exam.title}</h3>
              </Link>
              {exam.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{exam.description}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration_minutes} min</span>
                <span className="flex items-center gap-1"><FileText size={12} /> {exam.total_marks} marks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamList;
