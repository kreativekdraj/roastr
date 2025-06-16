
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Tag {
  id: string;
  name: string;
  emoji: string;
  is_sensitive: boolean;
}

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');

        if (error) throw error;
        setTags(data || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading };
};
