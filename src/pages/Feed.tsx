import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";

const Feed = () => {
  const [newPost, setNewPost] = useState("");
  
  // Mock data - replace with API calls
  const posts = [
    {
      id: 1,
      user: { name: "Sarah Johnson", avatar: "SJ" },
      content: "Just finished reading Psalms 23. Such a comforting reminder of God's presence! 🙏",
      likes: 24,
      comments: 5,
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      user: { name: "Michael Chen", avatar: "MC" },
      content: "Starting a new devotional series on grace. Join me on this journey! #BibleStudy",
      likes: 18,
      comments: 3,
      timestamp: "5 hours ago"
    }
  ];

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
            />
          </CardContent>
          <CardFooter>
            <Button className="ml-auto bg-spiritual hover:bg-spiritual/90">
              <Send className="h-4 w-4 mr-2" />
              Share
            </Button>
          </CardFooter>
        </Card>

        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-spiritual text-spiritual-foreground">
                    {post.user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.user.name}</p>
                  <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{post.content}</p>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {post.comments}
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
