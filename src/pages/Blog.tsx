import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-foreground md:text-6xl"
          >
            <span className="text-gradient">Blog</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground"
          >
            Insights, updates, and guides on AI-powered education
          </motion.p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-card-gradient" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card-gradient p-12 text-center shadow-card">
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">No posts yet</h3>
              <p className="text-muted-foreground">Stay tuned — our first articles are coming soon!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-xl border border-border bg-card-gradient shadow-card transition-all hover:border-steel/40 hover:shadow-glow"
                  >
                    {post.thumbnail_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="mb-2 font-display text-lg font-semibold text-foreground group-hover:text-steel transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User size={12} /> {post.author_name}</span>
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {format(new Date(post.published_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-steel">
                        Read more <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
