import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const BlogPreviewSection = () => {
  const { data: posts } = useQuery({
    queryKey: ["blog-preview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, published_at, thumbnail_url")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="relative py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
              Blog
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Latest from Our <span className="text-gradient">Blog</span>
            </h2>
          </div>
          <Link to="/blog" className="hidden md:block">
            <Button variant="hero-outline" size="sm" className="gap-2">
              View All <ArrowRight size={14} />
            </Button>
          </Link>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border bg-card-gradient shadow-card transition-all duration-300 hover:border-steel/30 hover:shadow-glow overflow-hidden"
              >
                {post.thumbnail_url && (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6">
                  {post.published_at && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {format(new Date(post.published_at), "MMM d, yyyy")}
                    </div>
                  )}
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground group-hover:text-steel transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/blog">
            <Button variant="hero-outline" size="sm" className="gap-2">
              View All Posts <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
