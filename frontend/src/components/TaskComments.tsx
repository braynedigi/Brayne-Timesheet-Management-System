import React, { useState, useEffect } from 'react';
import { useCommentStore, TaskComment, CreateCommentData } from '@/store/commentStore';
import { useAuthStore } from '@/store/authStore';
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  User, 
  Clock,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import UserMentions from './UserMentions';
import UserSearch from './UserSearch';

interface TaskCommentsProps {
  taskId: string;
  taskName: string;
  highlightCommentId?: string | null;
  commentScrollRef?: React.RefObject<HTMLDivElement>;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, taskName, highlightCommentId, commentScrollRef }) => {
  const { comments, fetchComments, createComment, updateComment, deleteComment, isLoading, error } = useCommentStore();
  const { user } = useAuthStore();
  
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPosition, setSearchPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(taskId);
  }, [taskId, fetchComments]);

  // Scroll to highlighted comment when it's available
  useEffect(() => {
    if (highlightCommentId && comments.length > 0) {
      const highlightedComment = comments.find(comment => comment.id === highlightCommentId);
      if (highlightedComment) {
        // Scroll to the comment after a short delay to ensure it's rendered
        setTimeout(() => {
          const commentElement = document.querySelector(`[data-comment-id="${highlightCommentId}"]`);
          if (commentElement) {
            commentElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          } else if (commentScrollRef?.current) {
            // Fallback to the ref if the element isn't found
            commentScrollRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 200);
      }
    }
  }, [highlightCommentId, comments, commentScrollRef]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        content: newComment.trim(),
        taskId,
      };
      await createComment(commentData);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditContent(content);
    setShowUserSearch(false);
    setSearchTerm('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canEditComment = (comment: TaskComment) => {
    return user?.id === comment.userId;
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Check for @ symbol to show user search
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const afterAt = value.slice(lastAtSymbol + 1);
      const spaceIndex = afterAt.indexOf(' ');
      
      if (spaceIndex === -1 || spaceIndex > 0) {
        const searchTerm = afterAt.slice(0, spaceIndex > 0 ? spaceIndex : undefined);
        setSearchTerm(searchTerm);
        setSearchPosition(lastAtSymbol);
        setShowUserSearch(true);
      } else {
        setShowUserSearch(false);
      }
    } else {
      setShowUserSearch(false);
    }
  };

  const handleUserSelect = (user: { id: string; firstName: string; lastName: string; email: string }) => {
    if (editingComment) {
      // Handle edit form
      const beforeAt = editContent.slice(0, searchPosition);
      const afterAt = editContent.slice(searchPosition + searchTerm.length + 1);
      const newValue = beforeAt + `@${user.firstName} ${user.lastName}` + afterAt;
      
      setEditContent(newValue);
    } else {
      // Handle new comment form
      const beforeAt = newComment.slice(0, searchPosition);
      const afterAt = newComment.slice(searchPosition + searchTerm.length + 1);
      const newValue = beforeAt + `@${user.firstName} ${user.lastName}` + afterAt;
      
      setNewComment(newValue);
    }
    
    setShowUserSearch(false);
    setSearchTerm('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await updateComment(commentId, { content: editContent.trim() });
      setEditingComment(null);
      setEditContent('');
      setShowUserSearch(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
    setShowUserSearch(false);
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Comments</h3>
          <span className="text-sm text-gray-500">({comments.length})</span>
        </div>
      </div>

      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Add a comment... Use @ to mention users"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              
              {/* User search dropdown */}
              {showUserSearch && (
                <UserSearch
                  onUserSelect={handleUserSelect}
                  onClose={() => setShowUserSearch(false)}
                  searchTerm={searchTerm}
                />
              )}
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Post</span>
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to add a comment to this task.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                data-comment-id={comment.id}
                className={`bg-gray-50 rounded-lg p-4 ${
                  highlightCommentId === comment.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                ref={highlightCommentId === comment.id ? commentScrollRef : undefined}
              >
                {editingComment === comment.id ? (
                  <div className="mt-3">
                    <div className="relative">
                        <textarea
                          value={editContent}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditContent(value);
                            
                            // Check for @ symbol to show user search
                            const lastAtSymbol = value.lastIndexOf('@');
                            if (lastAtSymbol !== -1) {
                              const afterAt = value.slice(lastAtSymbol + 1);
                              const spaceIndex = afterAt.indexOf(' ');
                              
                              if (spaceIndex === -1 || spaceIndex > 0) {
                                const searchTerm = afterAt.slice(0, spaceIndex > 0 ? spaceIndex : undefined);
                                setSearchTerm(searchTerm);
                                setSearchPosition(lastAtSymbol);
                                setShowUserSearch(true);
                              } else {
                                setShowUserSearch(false);
                              }
                            } else {
                              setShowUserSearch(false);
                            }
                          }}
                          placeholder="Edit comment... Use @ to mention users"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                      
                      {/* User search dropdown for edit form */}
                      {showUserSearch && editingComment === comment.id && (
                        <UserSearch
                          onUserSelect={handleUserSelect}
                          onClose={() => setShowUserSearch(false)}
                          searchTerm={searchTerm}
                        />
                      )}
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => handleCancelEdit()}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user.firstName} {comment.user.lastName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(comment.createdAt)}</span>
                            {comment.updatedAt !== comment.createdAt && (
                              <span>(edited)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {canEditComment(comment) && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditComment(comment.id, comment.content)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      
                      {/* Display user mentions */}
                      <UserMentions mentions={comment.mentions || []} />
                      
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskComments;
