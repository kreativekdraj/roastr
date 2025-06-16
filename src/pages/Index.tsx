
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostCard } from "@/components/PostCard";
import { CreatePost } from "@/components/CreatePost";
import { FilterBar } from "@/components/FilterBar";
import { UserNav } from "@/components/UserNav";
import { Plus } from "lucide-react";
import { toast } from "sonner";

// Mock data for demonstration - in real app this would come from Supabase
const mockPosts = [
  {
    id: "1",
    content: "Why don't scientists trust atoms? Because they make up everything!",
    tags: ["😂", "🧀"],
    tagNames: ["Joke", "Dad Joke"],
    upvotes: 156,
    downvotes: 12,
    username: "ComedyKing",
    isAnonymous: false,
    createdAt: "2024-01-15T10:30:00Z",
    isNSFW: false
  },
  {
    id: "2",
    content: "Your hairline is so far back, it's got its own zip code and they're considering making it a separate time zone.",
    tags: ["🔥", "😈"],
    tagNames: ["Roast", "Insult"],
    upvotes: 234,
    downvotes: 45,
    username: "Anonymous",
    isAnonymous: true,
    createdAt: "2024-01-15T09:15:00Z",
    isNSFW: false
  },
  {
    id: "3",
    content: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    tags: ["😂", "🙃"],
    tagNames: ["Joke", "Sarcasm"],
    upvotes: 89,
    downvotes: 23,
    username: "WittyWilson",
    isAnonymous: false,
    createdAt: "2024-01-15T08:45:00Z",
    isNSFW: false
  },
  {
    id: "4",
    content: "You're like a software update. Whenever I see you, I think 'not now.'",
    tags: ["😈", "🧠"],
    tagNames: ["Insult", "Satire"],
    upvotes: 312,
    downvotes: 67,
    username: "TechSavage",
    isAnonymous: false,
    createdAt: "2024-01-15T07:20:00Z",
    isNSFW: false
  },
  {
    id: "5",
    content: "Your performance in bed is like a Windows update - it takes forever, happens when you least expect it, and leaves everyone disappointed.",
    tags: ["🔞", "🔥", "😈"],
    tagNames: ["NSFW", "Roast", "Insult"],
    upvotes: 445,
    downvotes: 89,
    username: "Anonymous",
    isAnonymous: true,
    createdAt: "2024-01-14T22:10:00Z",
    isNSFW: true
  }
];

const Index = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [filteredPosts, setFilteredPosts] = useState(mockPosts);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showNSFW, setShowNSFW] = useState(false);

  const allTags = [
    { emoji: "😂", name: "Joke" },
    { emoji: "😈", name: "Insult" },
    { emoji: "🔥", name: "Roast" },
    { emoji: "🔞", name: "NSFW" },
    { emoji: "☠️", name: "Dark" },
    { emoji: "🧀", name: "Dad Joke" },
    { emoji: "🙃", name: "Sarcasm" },
    { emoji: "🧠", name: "Satire" }
  ];

  useEffect(() => {
    let filtered = [...posts];

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => 
        selectedTags.some(tag => post.tags.includes(tag))
      );
    }

    // Sort posts
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "upvotes":
        filtered.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "controversial":
        filtered.sort((a, b) => (b.downvotes / Math.max(b.upvotes, 1)) - (a.downvotes / Math.max(a.upvotes, 1)));
        break;
    }

    setFilteredPosts(filtered);
  }, [posts, selectedTags, sortBy]);

  const handleCreatePost = (newPost: any) => {
    const post = {
      id: Date.now().toString(),
      ...newPost,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString()
    };
    setPosts([post, ...posts]);
    setShowCreatePost(false);
    toast.success("Post created successfully! 🔥");
  };

  const handleVote = (postId: string, voteType: "upvote" | "downvote") => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          upvotes: voteType === "upvote" ? post.upvotes + 1 : post.upvotes,
          downvotes: voteType === "downvote" ? post.downvotes + 1 : post.downvotes
        };
      }
      return post;
    }));
    toast.success(voteType === "upvote" ? "Upvoted! 👍" : "Downvoted! 👎");
  };

  const handleSave = (postId: string) => {
    toast.success("Post saved to your library! 📌");
  };

  const handleReport = (postId: string) => {
    toast.success("Post reported. Thanks for keeping Roastr clean! 🚫");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-orange-500">Roastr</h1>
              <span className="text-sm text-gray-400">Where jokes get roasted</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-orange-500">Filter Posts</h3>
                <FilterBar
                  tags={allTags}
                  selectedTags={selectedTags}
                  onTagChange={setSelectedTags}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
                
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2 text-orange-400">NSFW Content</h4>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNSFW}
                      onChange={(e) => setShowNSFW(e.target.checked)}
                      className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300">Show NSFW posts</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  onSave={handleSave}
                  onReport={handleReport}
                  showNSFW={showNSFW}
                />
              ))}
              
              {filteredPosts.length === 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400">No posts match your filters. Try adjusting your selection!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          tags={allTags}
        />
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 shadow-lg lg:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Index;
