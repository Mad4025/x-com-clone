import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({error: 'Failed to fetch posts'}, {status: 500})
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const text = formData.get('text') as string;
        const image = formData.get('image') as File | null;

        let imageUrl: string | null = null;
        if (image) {
            const fileName = `${Date.now()}-${image.name}`;
            const { error } = await supabase.storage.from('post-images').upload(fileName, image);
            if (error) {
                throw new Error(`Image upload failed: ${error.message}`);
            }
            const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
        }

        const newPost = await prisma.post.create({
            data: {
                text,
                image: imageUrl,
            },
        });

        return NextResponse.json(newPost, { status: 201 })
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({error: 'Failed to create post'}, {status: 500})
    }
}