import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, Edit2, Trash2, Save, X } from "lucide-react";
import { postAPI, userAPI } from "@/services/api";
import { toast } from "sonner";

interface Post {
  id: string;
  user: {
    id: number;
    username: string;
    email: string;
    bio: string;
    avatar: string | null;
  };
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  likes: number[];
}

interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string | null;
}

const Feed = () => {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading feed data...');
      
      // Load posts with individual error handling
      try {
        const postsData = await postAPI.getAll();
        console.log('Posts loaded:', postsData);
        setPosts(postsData as Post[]);
      } catch (postsError) {
        console.error('Error loading posts:', postsError);
        toast.error('Failed to load posts');
        setPosts([]); // Set empty array on error
      }
      
      // Load user profile with individual error handling
      try {
        const userData = await userAPI.getProfile();
        console.log('User data loaded:', userData);
        setCurrentUser(userData as User);
      } catch (userError) {
        console.error('Error loading user profile:', userError);
        // Set a default anonymous user if profile fails
        setCurrentUser({
          id: 0,
          username: 'Anonymous',
          email: 'anonymous@example.com',
          bio: '',
          avatar: null
        });
      }
      
      console.log('Feed data loading completed');
    } catch (error) {
      console.error('Unexpected error in loadData:', error);
      toast.error('Failed to load feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      
      await postAPI.create(formData);
      setNewPost("");
      toast.success('Post created successfully!');
      loadData(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await postAPI.like(postId);
      loadData(); // Reload to get updated like count
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postAPI.delete(postId);
      toast.success('Post deleted successfully!');
      loadData(); // Reload posts
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const startEditing = (post: Post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent("");
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${postId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ content: editContent })
      });
      
      if (!response.ok) throw new Error('Failed to update post');
      
      toast.success('Post updated successfully!');
      setEditingPost(null);
      setEditContent("");
      loadData(); // Reload posts
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">Loading feed...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Share Your Thoughts</h2>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What's on your heart today?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
              disabled={submitting}
            />
          </CardContent>
          <CardFooter>
            <Button 
              className="ml-auto bg-spiritual hover:bg-spiritual/90"
              onClick={handleCreatePost}
              disabled={submitting || !newPost.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Sharing...' : 'Share'}
            </Button>
          </CardFooter>
        </Card>

        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-spiritual text-spiritual-foreground">
                      {getUserInitials(post.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.user.username}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                {currentUser && currentUser.id === post.user.id && (
                  <div className="flex gap-2">
                    {editingPost === post.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={!editContent.trim()}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(post)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingPost === post.id ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              )}
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${post.likes.includes(currentUser?.id || 0) ? 'text-red-500' : ''}`}
                onClick={() => handleLikePost(post.id)}
              >
                <Heart className={`h-4 w-4 ${post.likes.includes(currentUser?.id || 0) ? 'fill-current' : ''}`} />
                {post.likes_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default Feed;
