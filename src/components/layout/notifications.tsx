"use client";

import { useEffect, useState } from "react";
import { fetchEducationNews, NewsArticle } from "@/lib/news";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Newspaper } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export function NotificationPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducationNews(3)
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching notification news:", error);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-80 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-5 w-5" />
          <span className="font-medium">Latest News</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          <span className="font-medium">Latest News</span>
        </div>
        <Link 
          href="/news" 
          className="text-xs text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      
      <ScrollArea className="h-80">
        <div className="p-4 pt-0 space-y-3">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <Card key={index} className="border-none shadow-none bg-muted/30 hover:bg-muted/50 transition-colors">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <Badge variant="outline" className="text-xs h-5">
                      {article.source?.name || 'News'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.publishedAt)}
                    </div>
                  </div>
                  <h4 className="text-sm font-medium leading-tight line-clamp-2">
                    {article.title}
                  </h4>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <CardDescription className="text-xs line-clamp-2 mb-2">
                    {article.description}
                  </CardDescription>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Read More
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No news available at the moment.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
