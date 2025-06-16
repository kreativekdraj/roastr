
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  Flag, 
  Share2,
  Eye,
  BookmarkCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/hooks/usePosts";

interface PostCardProps {
  post: Post;
  onVote: (postId: string, voteType: "upvote" | "downvote") => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
  showNSFW: boolean;
}

export const PostCard = ({ post, onVote, onSave, onReport, showNSFW }: PostCardProps) => {
  const [isNSFWRevealed, setIsNSFWRevealed] = useState(false);

  const handleVote = (voteType: "upvote" | "downvote") => {
    onVote(post.id, voteType);
  };

  const handleShare = () => {
    const shareText = `${post.tags.map(t => t.emoji).join(" ")} ${post.content}\n\n🔗 Check out more roasts on Roastr!`;
    if (navigator.share) {
      navigator.share({
        title: "Roastr Post",
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const shouldBlurNSFW = post.isNSFW && !showNSFW && !isNSFWRevealed;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {post.isAnonymous ? "?" : post.username[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-white">
                {post.username}
              </p>
              <p className="text-sm text-gray-400">{timeAgo}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {post.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                {tag.emoji}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          {shouldBlurNSFW ? (
            <div className="relative">
              <div className="blur-sm select-none">
                <p className="text-gray-300 leading-relaxed">{post.content}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <Button
                  onClick={() => setIsNSFWRevealed(true)}
                  variant="outline"
                  className="border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show NSFW Content
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 leading-relaxed">{post.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Upvote */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              className={`flex items-center space-x-2 ${
                post.userVote === "upvote" 
                  ? "text-green-500 bg-green-500/10" 
                  : "text-gray-400 hover:text-green-500"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{post.upvotes}</span>
            </Button>

            {/* Downvote */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              className={`flex items-center space-x-2 ${
                post.userVote === "downvote" 
                  ? "text-red-500 bg-red-500/10" 
                  : "text-gray-400 hover:text-red-500"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{post.downvotes}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Save */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave(post.id)}
              className={`${
                post.isSaved
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-orange-500"
              }`}
            >
              {post.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-400 hover:text-blue-500"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            {/* Report */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReport(post.id)}
              className="text-gray-400 hover:text-red-500"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
