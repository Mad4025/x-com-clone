import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/server-utils";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext { params: { postId: string } }

export async function PUT(req: NextRequest, { params }: RouteContext) {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;
    const { postId } = params;

    try {
        const { text } = await req.json();
        if (typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'Post text cannot be empty for update.' }, { status: 400 });
        }

        const postToUpdate = await prisma.post.findUnique({ where: { id: postId } });
        if (!postToUpdate) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        if (postToUpdate.authorId !== user.id) {
            return NextResponse.json({ error: `Forbidden: You can only edit your own posts` }, { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { text: text.trim(), updatedAt: new Date() },
            include: {
                author: { select: { id: true, email: true } },
                comments: { include: { author: { select: { id: true, email: true } } },
                orderBy: { createdAt: 'asc' } },
                interactions: { select: { userId: true, type: true } },
            }
        });
        return NextResponse.json(updatedPost);
    } catch (error: any) {
        console.error(`Error updating post ${postId}:`, error);
        return NextResponse.json({ error: `Failed to update post: ${error.message}` }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;
    const { postId } = params;

    try {
        const postToDelete = await prisma.post.findUnique({ where: { id: postId } });
        if (!postToDelete) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        if (postToDelete.authorId !== user.id) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own posts' }, { status: 403 });
        }

        await prisma.post.delete({ where: { id: postId } });
        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error(`Error deleting post ${postId}`, error);
        return NextResponse.json({ error: `Failed to delete post: ${error.message}` }, { status: 500 });
    }
}