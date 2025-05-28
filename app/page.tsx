'use client'

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { ArrowUp, Loader2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

import { Comment, EnrichedPost, Interaction as InteractionData } from '@/app/types';
import { PostItem } from '@/components/PostItem';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/sonner';

function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [file, setFile] = useState<File>();
  const [postKey, setPostKey] = useState(Date.now());
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const response = await axios.get<EnrichedPost[]>('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts. Please try refreshing.');
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoadingSession(false);
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setIsLoadingSession(false);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            fetchPosts();
        }
        if (event === "SIGNED_OUT") {
            router.push('/login');
        }
      }
    );
    return () => authListener?.subscription.unsubscribe();
  }, [supabase, router, fetchPosts]);

  const handlePostSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      toast.error('You must be logged in to post.');
      router.push('/login');
      return;
    }
    if (inputValue.trim() === '' && !file) {
      toast.warning('Post cannot be empty. Write some text or add an image!');
      return;
    }

    setIsSubmittingPost(true);
    const formData = new FormData();
    if (inputValue.trim()) formData.append('text', inputValue.trim());
    if (file) formData.append('image', file);

    try {
      const response = await axios.post<EnrichedPost>('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.access_token}` 
        },
      });
      setPosts(prevPosts => [response.data, ...prevPosts]);
      setInputValue('');
      setFile(undefined);
      setPostKey(Date.now());
      toast.success("Post created successfully!");
    } catch (error) {
      console.error('Error posting content:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handlePostUpdate = (updatedPost: EnrichedPost) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const handleInteractionUpdate = (postId: string, newInteractions: InteractionData[]) => {
    setPosts(prevPosts => prevPosts.map(p => 
      p.id === postId ? { ...p, interactions: newInteractions } : p
    ));
  };

  const handleCommentAdded = (postId: string, newComment: Comment) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        const existingComments = p.comments || [];
        return { ...p, comments: [...existingComments, newComment] };
      }
      return p;
    }));
  };

  if (isLoadingSession && isLoadingPosts) {
    return <div className='flex justify-center items-center h-screen'><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className='m-2 sm:m-4 pb-16'>
      <Toaster richColors position="top-center" />
      <h1 className='text-3xl sm:text-4xl text-center mb-6 sm:mb-8 font-semibold'>X Platform Clone</h1>
      
      {session && (
        <form onSubmit={handlePostSubmit} className='max-w-2xl mx-auto mb-8 p-4 border rounded-lg shadow-sm bg-card'>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What's happening?"
            className='mb-2'
            rows={3}
          />
          <div className='flex flex-col sm:flex-row justify-between items-center gap-2'>
            <Input 
              type='file' 
              key={postKey} 
              onChange={(e) => { setFile(e.target.files?.[0]) }} 
              accept='image/*' 
              className='w-full sm:w-auto text-sm' 
            />
            <Button type='submit' className='w-full sm:w-auto' disabled={isSubmittingPost}>
              {isSubmittingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className='mr-2 h-4 w-4' />}
              Post
            </Button>
          </div>
        </form>
      )}
      {!session && !isLoadingSession && (
        <div className="text-center p-4 my-4 bg-secondary text-secondary-foreground rounded-md max-w-md mx-auto">
          <p>Please <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/login">log in</Link></Button> to post and interact.</p>
        </div>
      )}

      <div>
        {isLoadingPosts && posts.length === 0 && <div className='flex justify-center items-center mt-10'><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
        {!isLoadingPosts && posts.length === 0 && (
            <p className='text-center text-muted-foreground mt-10'>No posts yet. {session ? "Be the first to share something!" : "Log in to see posts."}</p>
        )}
        {posts.map(post => (
          <PostItem
            key={post.id}
            post={post}
            currentUserSession={session}
            onPostUpdate={handlePostUpdate}
            onPostDelete={handlePostDelete}
            onInteractionUpdate={handleInteractionUpdate}
            onCommentAdded={handleCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;