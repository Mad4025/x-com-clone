import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
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
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("API Auth Error:", authError?.message || "User not found in session");
            return NextResponse.json({ error: 'Unauthorized: You must be logged in to post.' }, { status: 401 });
        }

        const formData = await req.formData();
        const text = formData.get('text') as string | null; 
        const imageFile = formData.get('image') as File | null;

        if ((!text || text.trim() === "") && !imageFile) {
            return NextResponse.json({ error: 'Cannot create an empty post. Please provide text or an image.' }, { status: 400 });
        }

        let imageUrl: string | null = null;
        if (imageFile) {
            const fileName = `public/${user.id}-${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Image upload failed:', uploadError);
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }
            
            const { data: publicUrlData } = supabase.storage
                .from('post-images')
                .getPublicUrl(fileName);
            
            imageUrl = publicUrlData.publicUrl;
        }

        const newPost = await prisma.post.create({
            data: {
                text: text && text.trim() !== "" ? text.trim() : null,
                image: imageUrl,
                authorId: user.id,
            },
        });

        return NextResponse.json(newPost, { status: 201 });

    } catch (error) {
        console.error('Error creating post:', error);
        const message = error instanceof Error ? error.message : 'Failed to create post due to an unexpected server error.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}