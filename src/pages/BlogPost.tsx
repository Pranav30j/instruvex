import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("blog_posts" as any) as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} /> Back to Blog
            </Button>
          </Link>

          {isLoading ? (
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-secondary" />
              <div className="mt-8 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-secondary" />
                ))}
              </div>
            </div>
          ) : !post ? (
            <div className="mx-auto max-w-3xl text-center py-20">
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Post not found</h2>
              <p className="text-muted-foreground">This blog post doesn't exist or has been unpublished.</p>
            </div>
          ) : (
            <article className="mx-auto max-w-3xl">
              {post.thumbnail_url && (
                <div className="mb-8 aspect-video overflow-hidden rounded-xl">
                  <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                </div>
              )}
              <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
                {post.title}
              </h1>
              <div className="mb-8 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User size={14} /> {post.author_name}</span>
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </span>
                )}
              </div>
              <div className="prose prose-invert max-w-none text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_a]:text-steel">
                {post.content.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPost;
