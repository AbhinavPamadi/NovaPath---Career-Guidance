export async function fetchNewsByKeyword(keyword: string) {
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      keyword
    )}&apiKey=${"be76df14099e4cd286edf5e959907809"}`
  );
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await res.json();
  return data.articles; // list of news articles
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

// Function to fetch the latest education-related news for notifications
export async function fetchEducationNews(
  limit: number = 5
): Promise<NewsArticle[]> {
  try {
    const keywords = [
      "NEET",
      "JEE",
      "education",
      "career guidance",
      "college admission",
    ];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    const articles = await fetchNewsByKeyword(randomKeyword);
    return articles.slice(0, limit);
  } catch (error) {
    console.error("Error fetching education news:", error);
    return [];
  }
}
