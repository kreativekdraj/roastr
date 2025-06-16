
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Post {
  id: string;
  content: string;
  tags: { emoji: string; name: string }[];
  upvotes: number;
  downvotes: number;
  username: string;
  isAnonymous: boolean;
  createdAt: string;
  isNSFW: boolean;
  userVote?: "upvote" | "downvote" | null;
  isSaved?: boolean;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      // Fetch posts with tags and vote counts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          post_tags(
            tags(name, emoji, is_sensitive)
          ),
          profiles(username)
        `)
        .eq('status', 'visible')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // For each post, fetch vote counts and user's vote
      const postsWithVotes = await Promise.all(
        postsData.map(async (post) => {
          // Get vote counts
          const { data: voteCounts } = await supabase
            .rpc('get_vote_counts', { post_uuid: post.id });

          // Get user's vote if logged in
          let userVote = null;
          if (user) {
            const { data: voteData } = await supabase
              .from('votes')
              .select('vote_type')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            
            userVote = voteData?.vote_type || null;
          }

          // Check if saved by user
          let isSaved = false;
          if (user) {
            const { data: savedData } = await supabase
              .from('saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            
            isSaved = !!savedData;
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
            username: post.is_anonymous ? "Anonymous" : (post.profiles?.username || "Unknown"),
            isAnonymous: post.is_anonymous,
            createdAt: post.created_at,
            isNSFW: post.post_tags.some((pt: any) => pt.tags.is_sensitive),
            userVote,
            isSaved
          };
        })
      );

      setPosts(postsWithVotes);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const createPost = async (content: string, tagNames: string[], isAnonymous: boolean = false) => {
    try {
      // Get tag IDs
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tagNames);

      if (tagsError) throw tagsError;

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          user_id: isAnonymous ? null : user?.id,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags
      const postTags = tags.map(tag => ({
        post_id: post.id,
        tag_id: tag.id
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(postTags);

      if (tagError) throw tagError;

      // Refresh posts
      await fetchPosts();
      toast.success("Post created successfully! 🔥");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const vote = async (postId: string, voteType: "upvote" | "downvote") => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
        } else {
          // Update vote
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType,
            is_anonymous: false
          });
      }

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  const savePost = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to save posts");
      return;
    }

    try {
      const { data: existingSave } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingSave) {
        // Remove save
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        toast.success("Post removed from library");
      } else {
        // Save post
        await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        toast.success("Post saved to library! 📌");
      }

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  };

  const reportPost = async (postId: string) => {
    try {
      await supabase
        .from('reports')
        .insert({
          post_id: postId,
          user_id: user?.id || null,
          ip_hash: user ? null : 'anonymous_' + Date.now() // Simple anonymous tracking
        });

      toast.success("Post reported. Thanks for keeping Roastr clean! 🚫");
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to report post');
    }
  };

  return {
    posts,
    loading,
    createPost,
    vote,
    savePost,
    reportPost,
    refreshPosts: fetchPosts
  };
};
