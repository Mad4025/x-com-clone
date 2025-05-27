import { InteractionType as PrismaInteractionType } from "@prisma/client";

export interface Author {
    id: string;
    email: string;
}

export interface Comment {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
    author: Author;
    authorId: string;
    postId: string;
}

export interface Interaction {
    userId: string;
    type: PrismaInteractionType;
}

export interface EnrichedPost {
    id: string;
    text?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    author: Author;
    comments: Comment[];
    interactions: Interaction[];
}