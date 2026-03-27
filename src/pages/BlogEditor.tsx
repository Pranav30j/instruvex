import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";

const BlogEditor = () => {
  const { postId } = useParams<{ postId: string }>();
  const isEditing = !!postId;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const { isLoading: loadingPost } = useQuery({
    queryKey: ["blog-post-edit", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId!)
        .single();
      if (error) throw error;
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || "");
      setContent(data.content);
      setThumbnailUrl(data.thumbnail_url || "");
      return data;
    },
    enabled: isEditing,
  });

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) setSlug(generateSlug(val));
  };

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Instruvex Team";
      const payload = {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        thumbnail_url: thumbnailUrl || null,
        author_id: user!.id,
        author_name: authorName,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: publish ? "Blog published!" : "Draft saved!" });
      navigate("/dashboard/blog");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isEditing && loadingPost) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/blog")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isEditing ? "Edit Post" : "Write a Blog Post"}
          </h1>
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 shadow-card lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter blog title…"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                placeholder="url-friendly-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                placeholder="Short summary shown on blog listing…"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Write your blog content here… (supports paragraphs separated by newlines)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input
                placeholder="https://…"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Preview"
                  className="mt-2 aspect-video w-full rounded-lg border border-border object-cover"
                />
              )}
            </div>

            <div className="space-y-2 pt-4">
              <Button
                className="w-full gap-2"
                onClick={() => saveMutation.mutate(true)}
                disabled={!title || !slug || !content || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => saveMutation.mutate(false)}
                disabled={!title || !slug || saveMutation.isPending}
              >
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogEditor;
