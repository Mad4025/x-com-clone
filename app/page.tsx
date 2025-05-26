'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { ArrowUp } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react'

interface Post {
  id: string;
  text?: string;
  image?: string;
  createdAt: string;
}

function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [file, setFile] = useState<File>();
  const [postKey, setPostKey] = useState(Date.now());

  useEffect(() => {
    const fetchPosts = async () => {
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
    fetchPosts()
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    setInputValue(event.target.value)
  }

  const handlePostContent = async (event: FormEvent) => {
    event.preventDefault();
    if (inputValue.trim() === '' && !file) {
      alert('You cannot post empty data.')
      return;
    }

    const formData = new FormData();
    formData.append('text', inputValue);
    if (file) {
      formData.append('image', file);
    }

    try {
      const response = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
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

  return (
    <div className='m-4'>
      <h1 className='text-4xl text-center mb-4 font-semibold'>X Platform</h1>
      <form onSubmit={handlePostContent} className='flex max-w-4xl'>
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

      <div>
        { posts.map(post => (
          <ul key={post.id}>
            <Card className='mt-4'>
              <div className='mx-4'>
                {post.text && <p className='mb-2'>{post.text}</p>}
                {post.image && <img src={post.image} alt='Post image' className='max-w-sm max-h-xl object-contain' />}
              </div>
            </Card>
          </ul>
        )) }
      </div>
    </div>
  )
}

export default HomePage;