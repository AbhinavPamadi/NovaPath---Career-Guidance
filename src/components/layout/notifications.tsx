"use client";

import { useEffect, useState } from "react";
import { fetchEducationNews, NewsArticle } from "@/lib/news";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Newspaper } from "lucide-react";
// import { ScrollArea } from "@/components/ui/scroll-area";
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
      <div className="w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between p-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-foreground truncate">Latest News</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between p-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="font-medium text-foreground truncate">Latest News</span>
        </div>
        <Link 
          href="/news" 
          className="text-xs text-primary hover:underline font-medium flex-shrink-0 whitespace-nowrap"
        >
          View All
        </Link>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-3">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <Card key={index} className="border border-border/30 shadow-sm bg-card hover:bg-accent/50 transition-colors duration-200 overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 min-w-0">
                    <Badge variant="outline" className="text-xs h-5 px-2 flex-shrink-0">
                      {(article.source?.name || 'News').substring(0, 10)}
                    </Badge>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Calendar className="w-3 h-3" />
                      <span className="whitespace-nowrap">{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium leading-tight line-clamp-2 text-foreground break-words">
                    {article.title}
                  </h4>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <CardDescription className="text-xs line-clamp-2 mb-3 text-muted-foreground break-words">
                    {article.description}
                  </CardDescription>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors flex-shrink-0"
                  >
                    Read More
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Newspaper className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No news available at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
