import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/api';
import { Comment, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CommentsProps {
    entityType: string;
    entityId: string;
}

const Comments: React.FC<CommentsProps> = ({ entityType, entityId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchComments();
    }, [entityType, entityId]);

    const fetchComments = async () => {
        try {
            const response = await commentsAPI.getComments(entityType, entityId);
            if (response.success && response.data) {
                setComments(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await commentsAPI.create({
                content: newComment.trim(),
            });

            if (response.success && response.data) {
                setComments(prev => [response.data!, ...prev]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            const response = await commentsAPI.update(commentId, {
                content: editContent.trim(),
            });

            if (response.success && response.data) {
                setComments(prev =>
                    prev.map(comment =>
                        comment._id === commentId ? response.data! : comment
                    )
                );
                setEditingComment(null);
                setEditContent('');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await commentsAPI.delete(commentId);
            if (response.success) {
                setComments(prev => prev.filter(comment => comment._id !== commentId));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingComment(comment._id);
        setEditContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingComment(null);
        setEditContent('');
    };

    const canEditComment = (comment: Comment) => {
        return user && comment.author._id === user._id;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="space-y-3">
                <div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Comment'}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to leave a comment</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        {comment.author.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {comment.author.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                        {comment.updatedAt !== comment.createdAt && (
                                            <span className="text-xs text-gray-400">(edited)</span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    {editingComment === comment._id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                                rows={3}
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditComment(comment._id)}
                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {comment.content}
                                            </p>

                                            {/* Actions */}
                                            {canEditComment(comment) && (
                                                <div className="flex space-x-2 mt-2">
                                                    <button
                                                        onClick={() => startEditing(comment)}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Comments;