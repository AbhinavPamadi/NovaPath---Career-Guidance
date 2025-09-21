"use client";

import { useEffect, useState } from "react";
import { fetchNewsByKeyword, NewsArticle } from "@/lib/news";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState("NEET");
  
  const keywords = ["NEET", "JEE", "education", "career guidance", "college admission", "scholarship"];

  useEffect(() => {
    setLoading(true);
    fetchNewsByKeyword(selectedKeyword)
      .then((data) => {
        setArticles(data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
        setLoading(false);
      });
  }, [selectedKeyword]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Latest Educational News
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest news in education, career guidance, and academic opportunities
        </p>
      </div>

      {/* Keyword Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {keywords.map((keyword) => (
          <Button
            key={keyword}
            variant={selectedKeyword === keyword ? "default" : "outline"}
            onClick={() => setSelectedKeyword(keyword)}
            size="sm"
            className="capitalize"
          >
            {keyword}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading latest news...</p>
        </div>
      )}

      {/* News Articles */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {article.source?.name || 'News Source'}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(article.publishedAt)}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {article.urlToImage && (
                    <div className="relative h-48 w-full overflow-hidden rounded-md">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <CardDescription className="line-clamp-3">
                    {article.description}
                  </CardDescription>
                  
                  <Button 
                    asChild 
                    className="w-full" 
                    variant="outline"
                  >
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      Read More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No news articles found for "{selectedKeyword}". Try a different keyword.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
