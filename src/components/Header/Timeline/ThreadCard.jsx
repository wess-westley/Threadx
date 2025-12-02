import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import './ThreadCard.css';

const ThreadCard = ({ thread, index, onLike, onRepost, onDelete, currentUser }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(thread.comments || []);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || user.avatar,
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false,
      replies: []
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    setNewComment('');

    // Update thread in parent
    const updatedThread = { ...thread, comments: updatedComments };
    localStorage.setItem(
      'threadx_threads',
      JSON.stringify(
        JSON.parse(localStorage.getItem('threadx_threads') || '[]').map(t =>
          t.id === thread.id ? updatedThread : t
        )
      )
    );
  };

  const handleReply = (commentId, commentUsername) => {
    setReplyingTo({ commentId, commentUsername });
    setReplyContent(`@${commentUsername} `);
  };

  const submitReply = (commentId) => {
    if (!replyContent.trim() || !user) return;

    const reply = {
      id: `reply-${Date.now()}`,
      userId: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || user.avatar,
      content: replyContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false
    };

    const updatedComments = comments.map(comment =>
      comment.id === commentId
        ? { ...comment, replies: [reply, ...(comment.replies || [])] }
        : comment
    );

    setComments(updatedComments);
    setReplyingTo(null);
    setReplyContent('');

    // Update thread
    const updatedThread = { ...thread, comments: updatedComments };
    localStorage.setItem(
      'threadx_threads',
      JSON.stringify(
        JSON.parse(localStorage.getItem('threadx_threads') || '[]').map(t =>
          t.id === thread.id ? updatedThread : t
        )
      )
    );
  };

  const handleDeleteComment = (commentId) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);

    // Update thread
    const updatedThread = { ...thread, comments: updatedComments };
    localStorage.setItem(
      'threadx_threads',
      JSON.stringify(
        JSON.parse(localStorage.getItem('threadx_threads') || '[]').map(t =>
          t.id === thread.id ? updatedThread : t
        )
      )
    );
  };

  const handleDeleteThread = () => {
    if (thread.userId === user?.id) {
      onDelete(thread.id);
      setShowDeleteConfirm(false);
    }
  };

  const canDeleteThread = thread.userId === user?.id;
  const isThreadOwner = thread.userId === currentUser?.id;

  return (
    <motion.div
      className="thread-card"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
    >
      {/* Thread Header */}
      <div className="thread-header">
        <div className="thread-author">
          <div className="author-avatar">
            {thread.profileImage ? (
              thread.profileImage.startsWith('data:') || thread.profileImage.startsWith('http') ? (
                <img src={thread.profileImage} alt={thread.username} />
              ) : (
                <span className="avatar-emoji">{thread.profileImage}</span>
              )
            ) : (
              <span className="avatar-placeholder">👤</span>
            )}
          </div>
          <div className="author-info">
            <div className="author-names">
              <span className="author-username">{thread.username}</span>
              <span className="author-email">{thread.email}</span>
            </div>
            <span className="thread-timestamp">{formatTime(thread.timestamp)}</span>
          </div>
        </div>

        {canDeleteThread && (
          <div className="thread-menu">
            <motion.button
              className="menu-btn"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ⋮
            </motion.button>

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  className="delete-confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <p>Delete this thread?</p>
                  <div className="confirm-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="delete-btn"
                      onClick={handleDeleteThread}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Thread Content */}
      <div className="thread-content-wrapper">
        <p className="thread-content">{thread.content}</p>
      </div>

      {/* Thread Actions */}
      <div className="thread-actions">
        <motion.button
          className={`action-btn like-btn ${thread.liked ? 'liked' : ''}`}
          onClick={() => onLike(thread.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={thread.liked ? 'Unlike' : 'Like'}
        >
          <span className="action-icon">{thread.liked ? '❤️' : '🤍'}</span>
          <span className="action-count">{thread.likes}</span>
        </motion.button>

        <motion.button
          className={`action-btn repost-btn ${thread.reposted ? 'reposted' : ''}`}
          onClick={() => onRepost(thread.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={thread.reposted ? 'Undo repost' : 'Repost'}
        >
          <span className="action-icon">🔄</span>
          <span className="action-count">{thread.reposts}</span>
        </motion.button>

        <motion.button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Comments"
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{comments.length}</span>
        </motion.button>

        <motion.button
          className="action-btn share-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Share"
        >
          <span className="action-icon">📤</span>
        </motion.button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="comments-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Add Comment */}
            {user && (
              <div className="add-comment">
                <div className="comment-input-wrapper">
                  <div className="comment-avatar">
                    {user.profileImage ? (
                      user.profileImage.startsWith('data:') || user.profileImage.startsWith('http') ? (
                        <img src={user.profileImage} alt={user.username} />
                      ) : (
                        <span className="avatar-emoji">{user.profileImage}</span>
                      )
                    ) : (
                      <span className="avatar-placeholder">👤</span>
                    )}
                  </div>
                  <div className="comment-input-group">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add your thoughts..."
                      className="comment-input"
                    />
                    <motion.button
                      className="comment-submit-btn"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Post
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    className="comment-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="comment-header">
                      <div className="comment-avatar">
                        {comment.profileImage ? (
                          comment.profileImage.startsWith('data:') || comment.profileImage.startsWith('http') ? (
                            <img src={comment.profileImage} alt={comment.username} />
                          ) : (
                            <span className="avatar-emoji">{comment.profileImage}</span>
                          )
                        ) : (
                          <span className="avatar-placeholder">👤</span>
                        )}
                      </div>
                      <div className="comment-info">
                        <span className="comment-username">{comment.username}</span>
                        <span className="comment-time">{formatTime(comment.timestamp)}</span>
                      </div>
                    </div>

                    <p className="comment-text">{comment.content}</p>

                    <div className="comment-actions">
                      <button
                        className="comment-action reply-btn"
                        onClick={() => handleReply(comment.id, comment.username)}
                      >
                        Reply
                      </button>
                      {comment.userId === user?.id && (
                        <button
                          className="comment-action delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Reply Input */}
                    <AnimatePresence>
                      {replyingTo?.commentId === comment.id && (
                        <motion.div
                          className="reply-input-wrapper"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && submitReply(comment.id)}
                            placeholder="Write a reply..."
                            className="reply-input"
                            autoFocus
                          />
                          <div className="reply-actions">
                            <button
                              className="reply-cancel"
                              onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="reply-submit"
                              onClick={() => submitReply(comment.id)}
                              disabled={!replyContent.trim()}
                            >
                              Reply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-list">
                        {comment.replies.map((reply) => (
                          <motion.div
                            key={reply.id}
                            className="reply-item"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <div className="reply-header">
                              <div className="reply-avatar">
                                {reply.profileImage ? (
                                  reply.profileImage.startsWith('data:') || reply.profileImage.startsWith('http') ? (
                                    <img src={reply.profileImage} alt={reply.username} />
                                  ) : (
                                    <span className="avatar-emoji">{reply.profileImage}</span>
                                  )
                                ) : (
                                  <span className="avatar-placeholder">👤</span>
                                )}
                              </div>
                              <div className="reply-info">
                                <span className="reply-username">{reply.username}</span>
                                <span className="reply-time">{formatTime(reply.timestamp)}</span>
                              </div>
                            </div>
                            <p className="reply-text">{reply.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThreadCard;