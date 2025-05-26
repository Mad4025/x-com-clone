'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowUp } from 'lucide-react';
import { FormEvent, useState } from 'react'

interface Post {
  id: number;
  text?: string;
  image?: number;
}

function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [file, setFile] = useState<File>();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    setInputValue(event.target.value)
  }

  const handlePostContent = (event: FormEvent) => {
    event?.preventDefault();
    if (inputValue.trim() === '') {
      alert('You cannot post empty data.')
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      text: inputValue,
    }

    setPosts([...posts, newPost])
    setInputValue('')
  }

  return (
    <div className='m-4'>
      <h1 className='text-4xl text-center mb-4 font-semibold'>X Platform</h1>
      <form onSubmit={handlePostContent} className='flex max-w-4xl'>
        <Input type='file' onChange={(e) => { setFile(e.target.files?.[0]) }} accept='image/*' className='w-66 mr-2' />
        <Input type='text' value={inputValue} onChange={handleInputChange} placeholder='Type something to post...' className='mr-2' />
        <Button type='submit'><ArrowUp /></Button>
      </form>

      <div>
        { posts.map(post => (
          <ul key={post.id}>
            <Card className='mt-4'>
              <div className='mx-4'>
                { post.text }
                {post.image}
              </div>
            </Card>
          </ul>
        )) }
      </div>
    </div>
  )
}

export default HomePage;