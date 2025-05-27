import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button';
import LogOutButton from './LogOutButton';
import { DarkModeToggle } from './DarkModeToggle';
import { shadow } from '@/app/utils';

type Props = {
    userId: string | null;
}

async function Header({ userId }: Props) {
  return (
    <div className='relative flex h-20 w-full items-center justify-between bg-popover px-3 sm:px-8' style={{boxShadow: shadow}}>
        <Link href="/" className='flex items-end gap-2'>
            <Image src="globe.svg" alt='image!' width={60} height={60} className='rounded-full' priority />
            <h1 className='pb-1 flex flex-col text-2xl font-semibold leading-6'>
                X (Twitter)<span>Clone</span>
            </h1>
        </Link>

        <div className='flex gap-4'>
            { userId ? (
                <LogOutButton />
            ) : (
                <>
                    <Button asChild>
                        <Link href="/sign-up" className='hidden sm:block'>Sign Up</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/login">Log In</Link>
                    </Button>
                </>
            )}
            <DarkModeToggle />
        </div>
    </div>
  )
}

export default Header