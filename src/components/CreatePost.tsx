
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { useTags } from "@/hooks/useTags";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostProps {
  onClose: () => void;
  onSubmit: (content: string, tagNames: string[], isAnonymous: boolean) => void;
}

export const CreatePost = ({ onClose, onSubmit }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [postAsAnonymous, setPostAsAnonymous] = useState(false);
  const { tags } = useTags();
  const { user } = useAuth();

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Please enter some content!");
      return;
    }

    if (selectedTags.length === 0) {
      toast.error("Please select at least one tag!");
      return;
    }

    if (content.length > 2000) {
      toast.error("Content is too long! Maximum 2000 characters.");
      return;
    }

    onSubmit(content.trim(), selectedTags, postAsAnonymous);
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > 2000;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-orange-500">Create a Post</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Content Input */}
          <div>
            <Textarea
              placeholder="What's your roast? Drop your joke, insult, or roast here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                {characterCount}/2000 characters
              </span>
            </div>
          </div>

          {/* Tag Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Select Tags (at least one required)
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedTags.includes(tag.name)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-gray-800 text-gray-300 border-gray-600 hover:border-orange-500"
                  }`}
                  onClick={() => handleTagToggle(tag.name)}
                >
                  {tag.emoji} {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Anonymous Toggle */}
          {user && (
            <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="anonymous"
                checked={postAsAnonymous}
                onChange={(e) => setPostAsAnonymous(e.target.checked)}
                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-300 cursor-pointer">
                Post anonymously
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || selectedTags.length === 0 || isOverLimit}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Roast
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
