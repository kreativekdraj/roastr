
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predefined tags table
CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL,
  is_sensitive BOOLEAN DEFAULT FALSE
);

-- Insert predefined tags
INSERT INTO public.tags (name, emoji, is_sensitive) VALUES
  ('Joke', '😂', FALSE),
  ('Insult', '😈', FALSE),
  ('Roast', '🔥', FALSE),
  ('NSFW', '🔞', TRUE),
  ('Dark', '☠️', FALSE),
  ('Religion', '🕯', TRUE),
  ('Satire', '🧠', FALSE),
  ('Pun', '🧀', FALSE),
  ('Sarcasm', '🙃', FALSE),
  ('Dad Joke', '👨‍🦳', FALSE),
  ('Cringe', '😬', FALSE),
  ('Wordplay', '✍️', FALSE),
  ('Political', '🏛️', TRUE);

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000 AND LENGTH(TRIM(content)) > 0),
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'visible' CHECK (status IN ('visible', 'hidden_reported', 'hidden_manual', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_tags junction table
CREATE TABLE public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(ip_hash, post_id)
);

-- Create saved_posts table
CREATE TABLE public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(ip_hash, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (status = 'visible');

CREATE POLICY "Users can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for post_tags
CREATE POLICY "Post tags are viewable by everyone" ON public.post_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can insert post tags" ON public.post_tags
  FOR INSERT WITH CHECK (true);

-- RLS Policies for votes
CREATE POLICY "Votes are viewable by everyone" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for saved_posts
CREATE POLICY "Users can view their own saved posts" ON public.saved_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON public.saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts" ON public.saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reports
CREATE POLICY "Reports are viewable by moderators" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get vote counts
CREATE OR REPLACE FUNCTION public.get_vote_counts(post_uuid UUID)
RETURNS JSON AS $$
DECLARE
  upvotes INTEGER;
  downvotes INTEGER;
BEGIN
  SELECT COUNT(*) INTO upvotes FROM public.votes 
  WHERE post_id = post_uuid AND vote_type = 'upvote';
  
  SELECT COUNT(*) INTO downvotes FROM public.votes 
  WHERE post_id = post_uuid AND vote_type = 'downvote';
  
  RETURN json_build_object('upvotes', upvotes, 'downvotes', downvotes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get report count
CREATE OR REPLACE FUNCTION public.get_report_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.reports WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
