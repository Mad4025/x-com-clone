'use client';

import { Comment as CommentType, EnrichedPost, Interaction as InteractionData } from "@/app/types";
import { InteractionType } from "@prisma/client";
import { Session } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Edit3, Loader2, MessageSquare, Send, ThumbsDown, ThumbsUp, Trash2, XCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";

interface PostItemProps {
    post: EnrichedPost;
    currentUserSession: Session | null;
    onPostUpdate: (updatedPost: EnrichedPost) => void;
    onPostDelete: (postId: string) => void;
    onInteractionUpdate: (postId: string, newInteractions: InteractionData[]) => void;
    onCommentAdded: (postId: string, newComment: CommentType) => void;
}

export function PostItem({
    post, currentUserSession, onPostUpdate, onPostDelete, onInteractionUpdate, onCommentAdded,
}: PostItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(post.text || '');
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLoading, setIsLoading] = useState({
        edit: false, delete: false, interact: false, comment: false
    });

    const currentUserId = currentUserSession?.user?.id;
    const isAuthor = post.authorId === currentUserId;

    const { likeCount, dislikeCount, userInteractionType } = useMemo(() => {
        const likes = post.interactions.filter(i => i.type === InteractionType.LIKE).length;
        const dislikes = post.interactions.filter(i => i.type === InteractionType.DISLIKE).length;
        const userInteractionType = post.interactions.find(i => i.type === currentUserId);
        return { likeCount: likes, dislikeCount: dislikes, userInteractionType: userInteractionType };
    }, [post.interactions, currentUserId]);

    const handleApiCall = async (
        action: 'edit' | 'delete' | 'interact' | 'comment',
        apiCall: () => Promise<void>
    ) => {
        setIsLoading(prev => ({ ...prev, [action]: true }));
        try {
            await apiCall();
        } catch (error) {
            const axiosError = error as AxiosError<{ error?: string }>;
            const message = axiosError.response?.data?.error || `Failed to ${action} post.`;
            toast.error(message);
            console.error(`Error ${action} post:`, error)
        } finally {
            setIsLoading(prev => ({ ...prev, [action]: false }));
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) setEditedText(post.text || '');
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editedText.trim() || !currentUserSession) return;
        handleApiCall('edit', async () => {
            const response = await axios.put(`/api/posts/${post.id}`,
                { text: editedText },
                { headers: { Authorization: `Bearer ${currentUserSession.access_token}` } 
            });
            onPostUpdate(response.data);
            setIsEditing(false);
            toast.success('Post updated!');
        });
    };

    const handleDelete = () => {
        if (!currentUserSession || !window.confirm('Are you sure you want to delete this post?')) return;
        handleApiCall('delete', async () => {
            await axios.delete(`/api/posts/${post.id}`, {
                headers: { Authorization: `Bearer ${currentUserSession.access_token}` },
            });
            onPostDelete(post.id);
            toast.success('Post deleted!');
        });
    };

    const handleInteraction = (type: InteractionType) => {
        if (!currentUserSession) return;
        handleApiCall('interact', async () => {
            const response = await axios.post(`/api/posts/${post.id}/interactions`,
                { type },
                { headers: { Authorization: `Bearer ${currentUserSession.access_token}` } }
            );
            onInteractionUpdate(post.id, response.data.newInteractionsList);
        });
    };

    const handleCommentSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !currentUserSession) return;
        handleApiCall('comment', async () => {
            const response = await axios.post(`/api/posts/${post.id}/comments`,
                { text: commentText },
                { headers: { Authorization: `Bearer ${currentUserSession.access_token}` } 
            });
            onCommentAdded(post.id, response.data);
            setCommentText('');
            toast.success('Comment added!');
            if (!showComments) setShowComments(true);
        });
    };

    return (
    <Card className="mt-4 max-w-2xl mx-auto" id={`post-${post.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.author.email.split('@')[0]}`} />
              <AvatarFallback>{post.author.email.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{post.author.email}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleString()}
                {post.updatedAt !== post.createdAt && ` (edited ${new Date(post.updatedAt).toLocaleTimeString()})`}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" onClick={handleEditToggle} disabled={isLoading.edit} title={isEditing ? "Cancel edit" : "Edit post"}>
                {isLoading.edit ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <XCircle className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isLoading.delete} title="Delete post">
                {isLoading.delete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2">
            <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} rows={3} className="w-full" disabled={isLoading.edit} />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleEditToggle} disabled={isLoading.edit}>Cancel</Button>
              <Button type="submit" disabled={isLoading.edit || !editedText.trim()}>
                {isLoading.edit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
              </Button>
            </div>
          </form>
        ) : (
          <>
            {post.text && <p className="mb-2 whitespace-pre-wrap">{post.text}</p>}
            {post.image && <img src={post.image} alt="Post image" className="max-w-full rounded-md h-auto object-contain my-2" />}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-3 pt-3 border-t">
        <div className="flex space-x-2 sm:space-x-4 items-center">
          <Button variant="ghost" size="sm" onClick={() => handleInteraction(InteractionType.LIKE)} disabled={!currentUserSession || isLoading.interact}>
            {isLoading.interact && InteractionType.LIKE ? <Loader2 className="h-5 w-5 mr-1 animate-spin" /> : <ThumbsUp className={`h-5 w-5 mr-1 ${InteractionType.LIKE ? 'text-blue-500 fill-blue-300' : ''}`} />} {likeCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleInteraction(InteractionType.DISLIKE)} disabled={!currentUserSession || isLoading.interact}>
             {isLoading.interact && InteractionType.DISLIKE ? <Loader2 className="h-5 w-5 mr-1 animate-spin" /> : <ThumbsDown className={`h-5 w-5 mr-1 ${InteractionType.DISLIKE ? 'text-red-500 fill-red-300' : ''}`} />} {dislikeCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="h-5 w-5 mr-1" /> {post.comments.length}
          </Button>
        </div>

        {currentUserSession && (
          <form onSubmit={handleCommentSubmit} className="w-full flex space-x-2 items-center pt-2">
            <Avatar className="hidden sm:block">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUserSession.user.email?.split('@')[0]}`} />
              <AvatarFallback>{currentUserSession.user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-grow" disabled={isLoading.comment} />
            <Button type="submit" size="icon" disabled={!commentText.trim() || isLoading.comment}>
              {isLoading.comment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}

        {showComments && (
          <div className="w-full pt-3 mt-3 border-t">
            <h4 className="text-sm font-semibold mb-2">Comments ({post.comments.length})</h4>
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="text-sm py-2 border-b last:border-b-0">
                  <div className="flex items-start space-x-2 mb-1">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author.email.split('@')[0]}`} />
                        <AvatarFallback>{comment.author.email.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="font-medium text-xs">{comment.author.email}</span>
                        <span className="text-xs text-muted-foreground ml-2 ">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <p className="whitespace-pre-wrap text-sm mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                  {/* TODO: Edit/Delete comments (similar logic to the post edit/delete functionality, needs new API endpoints) */}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}