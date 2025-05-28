import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/server-utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseApiClientForStorage = createSupabaseJsClient(supabaseUrl, supabaseAnonKey);
const supabaseAdminClientForStorage = createSupabaseJsClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                author: { select: { id: true, email: true } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: { author: { select: { id: true, email: true } } }
                },
                interactions: {
                    select: { userId: true, type: true }
                },
             }
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    try {
        const formData = await req.formData();
        const text = formData.get('text') as string | null; 
        const imageFile = formData.get('image') as File | null;

        if (!text?.trim() && !imageFile) {
            return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 });
        }
        
        let imageUrl: string | null = null;
        if (imageFile) {
            const fileName = `${user.id}-${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabaseAdminClientForStorage.storage
                .from('post-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Image upload failed:', uploadError);
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }
            
            imageUrl = supabaseApiClientForStorage.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
        }

        const newPost = await prisma.post.create({
            data: {
                text: text?.trim() || undefined,
                image: imageUrl,
                authorId: user.id,
            },
            include: {
                author: { select: { id: true, email: true } },
                interactions: true,
                comments: true,
            }
        });
        return NextResponse.json(newPost, { status: 201 });

    } catch (error: any) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: `Failed to create post: ${error.message}` }, { status: 500 });
    }
}