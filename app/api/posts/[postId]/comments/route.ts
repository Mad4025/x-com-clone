import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/server-utils";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
    params: { postId: string }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;
    const { postId } = params;

    try {
        const { text } = await req.json();
        if (!text.trim() || typeof text !== 'string') {
            return NextResponse.json({ error: 'Input cannot be empty' }, { status: 400 });
        }

        const postExists = await prisma.post.findUnique({ where: { id: postId } });
        if (!postExists) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const newComment = await prisma.comment.create({
            data: { text: text.trim(), authorId: user.id, postId: postId },
            include: { author: { select: { id: true, email: true } } }
        });
        return NextResponse.json(newComment, { status: 201 });
    } catch (error: any) {
        console.error(`Error creating comment for post ${postId}:`, error);
        return NextResponse.json({ error: `Failed to create comment: ${error.message}` }, { status: 500 });
    }
}