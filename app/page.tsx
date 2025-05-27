'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { ArrowUp } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Post {
  id: string;
  text?: string;
  image?: string;
  createdAt: string;
  authorId: string;
}

function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsloadingSession] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [file, setFile] = useState<File>();
  const [postKey, setPostKey] = useState(Date.now());

  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
      const response = await axios.get('/api/posts');
      setPosts(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error fetching posts:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('Unexpected error fetching posts:', error);
      }
    }
    };
    fetchInitialPosts();
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsloadingSession(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setIsloadingSession(false);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe()
    };
  }, [supabase, router]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    setInputValue(event.target.value)
  }

  const handlePostContent = async (event: FormEvent) => {
    event.preventDefault();

    if (isLoadingSession) {
      alert('Please wait a moment until you are logged in.');
    }

    if (!session) {
      router.push('/login');
    }

    if (inputValue.trim() === '' && !file) {
      alert('You cannot post empty data.')
      return;
    }

    const formData = new FormData();
    if (inputValue.trim() !== '') {
      formData.append('text', inputValue.trim());
    }
    if (file) {
      formData.append('image', file);
    }

    try {
      const response = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session?.access_token}`
        },
      });
      setPosts([response.data, ...posts]);
      setInputValue('');
      setFile(undefined);
      setPostKey(Date.now());
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error posting content:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('Unexpected error posting content:', error);
      }
      alert('Failed to post. Please try again.');
    }
  };

  if (isLoadingSession && !session) {
    return <div className='text-center p-8 animate-pulse'>Loading your X experience...</div>;
  }

  return (
    <div className='m-4'>
      <h1 className='text-4xl text-center mb-8 font-semibold'>X Platform</h1>
      { session && (
      <form onSubmit={handlePostContent} className='flex max-w-4xl mx-auto'>
        <Input 
        type='file' 
        key={postKey} 
        onChange={(e) => { setFile(e.target.files?.[0]) }} 
        accept='image/*' 
        className='w-66 mr-2' 
        />
        <Input 
        type='text' 
        value={inputValue} 
        onChange={handleInputChange} 
        placeholder='Type something to post...' 
        className='mr-2' 
        />
        <Button type='submit'><ArrowUp /></Button>
      </form>
      )}

      {!session && !isLoadingSession && (
        <div className="text-center p-4 my-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <p>Please <Button variant="link" asChild><Link href="/login">log in</Link></Button> to post and see content.</p>
        </div>
      )}

      <div>
        { posts.map(post => (
            <Card key={post.id} className='mt-4'>
              <div className='mx-4'>
                {post.text && <p className='mb-2'>{post.text}</p>}
                {post.image && <img src={post.image} alt='Post image' className='max-w-sm max-h-xl object-contain' />}
                <p className="text-xs mt-2">Posted on: {new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </Card>
        )) }
      </div>
    </div>
  )
}

export default HomePage;