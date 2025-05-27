import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/server-utils";
import { InteractionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext { params: { postId: string } };

export async function POST(req: NextRequest, { params }: RouteContext) {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user;
    const { postId } = params;

    try {
        const { type } = (await req.json()) as { type: InteractionType };
        if (!type || (type !== InteractionType.LIKE && type !== InteractionType.DISLIKE)) {
            return NextResponse.json({ error: 'Invalid interaction type.' }, { status: 400 });
        }

        const postExists = await prisma.post.findUnique({ where: { id: postId } });
        if (!postExists) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const existingInteraction = await prisma.interaction.findUnique({
            where: { userId_postId: { userId: user!.id, postId: postId } }
        });

        if (existingInteraction) {
            if (existingInteraction.type === type) {
                await prisma.interaction.delete({ where: { id: existingInteraction.id } });
            } else {
                await prisma.interaction.update({
                    where: { id: existingInteraction.id },
                    data: { type }
                });
            }
        } else {
            await prisma.interaction.create({
                data: { userId: user!.id, postId: postId, type: type }
            });
        }

        const updatedInteractionsForPost = await prisma.interaction.findMany({
            where: { postId: postId },
            select: { userId: true, type: true }
        });

        return NextResponse.json({
            postId: postId,
            newInteractionsList: updatedInteractionsForPost
        }, { status: 200 });
    } catch (error: any) {
        console.error(`Error handling interaction for post ${postId}:`, error);
        return NextResponse.json({ error: `Failed to process interaction: ${error.message}` }, { status: 500 });
    }
}