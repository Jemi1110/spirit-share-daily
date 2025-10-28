import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Heart, PenTool, Settings, LogOut, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI, postAPI, devotionalAPI, prayerAPI } from "@/services/api";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Devotional {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Prayer {
  id: string;
  title: string;
  description: string;
  prayer_count: number;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userData, postsData, devotionalsData, prayersData] = await Promise.all([
        userAPI.getProfile(),
        postAPI.getAll(),
        devotionalAPI.getAll(),
        prayerAPI.getAll()
      ]);
      
      const user = userData as User;
      setUser(user);
      setEditForm({
        username: user.username,
        email: user.email,
        bio: user.bio || ""
      });
      
      // Filter user's own content
      const posts = postsData as any[];
      const devotionals = devotionalsData as any[];
      const prayers = prayersData as any[];
      
      setPosts(posts.filter((post: any) => post.user.id === user.id));
      setDevotionals(devotionals.filter((dev: any) => dev.user.id === user.id));
      setPrayers(prayers.filter((prayer: any) => prayer.user.id === user.id));
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/auth");
  };

  const handleUpdateProfile = async () => {
    try {
      await userAPI.updateProfile(editForm);
      toast.success('Profile updated successfully!');
      setEditDialogOpen(false);
      loadUserData(); // Reload user data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Failed to load profile</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-spiritual text-spiritual-foreground text-2xl">
                    {getUserInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.username}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="mt-2 max-w-md">{user.bio || "No bio yet"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          placeholder="Enter email"
                          type="email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateProfile}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-spiritual">{devotionals.length}</p>
                <p className="text-sm text-muted-foreground">Devotionals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-prayer">{prayers.length}</p>
                <p className="text-sm text-muted-foreground">Prayers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="devotionals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devotionals">Devotionals</TabsTrigger>
            <TabsTrigger value="prayers">Prayers</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="devotionals" className="space-y-4 mt-4">
            {devotionals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No devotionals yet</p>
                </CardContent>
              </Card>
            ) : (
              devotionals.map((devotional) => (
                <Card key={devotional.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-devotional" />
                      {devotional.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{devotional.content.substring(0, 150)}...</p>
                    <p className="text-sm text-muted-foreground mt-2">{formatDate(devotional.created_at)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="prayers" className="space-y-4 mt-4">
            {prayers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No prayer requests yet</p>
                </CardContent>
              </Card>
            ) : (
              prayers.map((prayer) => (
                <Card key={prayer.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-prayer" />
                      {prayer.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{prayer.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {prayer.prayer_count} people prayed • {formatDate(prayer.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No posts yet</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PenTool className="h-5 w-5 text-spiritual" />
                      Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{post.likes_count} likes</span>
                      <span>{post.comments_count} comments</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
