import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, PenTool, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/services/api";

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate("/auth");
  };

  // Mock user data
  const user = {
    name: "John Doe",
    username: "@johndoe",
    bio: "Follower of Christ | Bible study enthusiast | Sharing my faith journey",
    stats: {
      devotionals: 12,
      prayers: 34,
      posts: 28
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-spiritual text-spiritual-foreground text-2xl">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground">{user.username}</p>
                  <p className="mt-2 max-w-md">{user.bio}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-spiritual">{user.stats.devotionals}</p>
                <p className="text-sm text-muted-foreground">Devotionals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-prayer">{user.stats.prayers}</p>
                <p className="text-sm text-muted-foreground">Prayers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{user.stats.posts}</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-devotional" />
                  Walking in Faith
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Today we explore what it means to trust God completely...</p>
                <Badge className="mt-2">Proverbs 3:5-6</Badge>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prayers" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-prayer" />
                  Guidance for new opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Seeking God's wisdom in my career decisions...</p>
                <p className="text-sm text-muted-foreground mt-2">18 people prayed</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenTool className="h-5 w-5 text-spiritual" />
                  Just finished reading Psalms 23
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Such a comforting reminder of God's presence! 🙏</p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>24 likes</span>
                  <span>5 comments</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
