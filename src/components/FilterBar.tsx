
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "@/hooks/useTags";

interface FilterBarProps {
  tags: Tag[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const FilterBar = ({ tags, selectedTags, onTagChange, sortBy, onSortChange }: FilterBarProps) => {
  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
    onTagChange(newTags);
  };

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="newest">🕐 Newest First</SelectItem>
            <SelectItem value="oldest">🕐 Oldest First</SelectItem>
            <SelectItem value="upvotes">👍 Most Upvoted</SelectItem>
            <SelectItem value="controversial">🔥 Most Controversial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag Filters */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Filter by Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.name) ? "default" : "outline"}
              className={`cursor-pointer transition-all text-xs ${
                selectedTags.includes(tag.name)
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-gray-800 text-gray-300 border-gray-600 hover:border-orange-500"
              }`}
              onClick={() => handleTagToggle(tag.name)}
            >
              {tag.emoji}
            </Badge>
          ))}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => onTagChange([])}
            className="text-xs text-orange-500 hover:text-orange-400 mt-2"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
