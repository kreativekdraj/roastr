
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Post } from "@/hooks/usePosts";

export default function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchSavedPosts();
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user) return;

    try {
      const { data: savedPostsData, error } = await supabase
        .from('saved_posts')
        .select(`
          posts (
            *,
            post_tags (
              tags (name, emoji)
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const posts = await Promise.all(
        savedPostsData.map(async (saved: any) => {
          const post = saved.posts;
          
          // Get vote counts
          const { data: voteCountsData } = await supabase
            .rpc('get_vote_counts', { post_uuid: post.id });
          const voteCounts = voteCountsData as { upvotes: number; downvotes: number };

          // Get user's vote
          const { data: voteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();

          // Get username for non-anonymous posts
          let username = "Anonymous";
          if (!post.is_anonymous && post.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', post.user_id)
              .maybeSingle();
            username = profileData?.username || "Unknown";
          }

          return {
            id: post.id,
            content: post.content,
            tags: post.post_tags.map((pt: any) => ({
              emoji: pt.tags.emoji,
              name: pt.tags.name
            })),
            upvotes: voteCounts?.upvotes || 0,
            downvotes: voteCounts?.downvotes || 0,
            username,
            isAnonymous: post.is_anonymous,
            createdAt: post.created_at,
            isNSFW: post.post_tags.some((pt: any) => pt.tags.is_sensitive),
            userVote: voteData?.vote_type || null,
            isSaved: true
          };
        })
      );

      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-orange-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-orange-500">Saved Posts</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {savedPosts.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No saved posts yet. Start saving some roasts! 🔥</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={() => {}}
                onSave={() => {}}
                onReport={() => {}}
                onDelete={() => {}}
                showNSFW={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
