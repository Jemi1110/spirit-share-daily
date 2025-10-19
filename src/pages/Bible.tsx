import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Highlighter, MessageSquare } from "lucide-react";

const Bible = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("KJV");
  
  // Mock verse data
  const currentVerse = {
    reference: "Psalm 23:1",
    text: "The LORD is my shepherd; I shall not want."
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bible Reader</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search verses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KJV">King James</SelectItem>
                  <SelectItem value="NIV">NIV</SelectItem>
                  <SelectItem value="ESV">ESV</SelectItem>
                  <SelectItem value="NKJV">NKJV</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-spiritual hover:bg-spiritual/90">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-spiritual">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-spiritual">{currentVerse.reference}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-lg leading-relaxed">{currentVerse.text}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-spiritual-light">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Reading Plans</h4>
            <p className="text-sm text-muted-foreground">
              Create or join Bible reading plans with your community
            </p>
            <Button className="mt-4 bg-spiritual hover:bg-spiritual/90">
              Explore Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Bible;
