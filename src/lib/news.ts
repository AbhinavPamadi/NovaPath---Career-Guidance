// Super-expanded list of banned/foul words including Gen Z slang and abbreviations
const bannedWords = [
  "sex", "porn", "pornography", "nudity", "nudist", "erotic", "nsfw", "fetish", "masturbation", "orgy", "bdsm", "sexual", "sexually", "xxx", "adult", "pornhub", "pornstar", "hookup", "strip", "stripper", "sexy", "seduce", "slut",
  "whore", "pervert", "voyeur","violence", "murder", "rape", "assault", "blood", "gore", "slaughter", "torture", "attack", "kill", "dead", "suicide", "stab", "shooting", "gun", "bomb", "explosion","drugs", "cocaine", "heroin", "marijuana",
  "meth", "opium", "weed", "xanax", "ecstasy", "lsd","gambling", "casino","prostitution","abuse", "harassment","obscene", "insult", "curse", "cursing", "threat","molest", "incest", "attack", "harass", "bully","milf","dilf","wtf", "stfu",
  "tf", "rekt", "finna", "vibe","slaps","thot","kys","nudie", "nudes", "cum", "blowjob", "handjob", "threesome", "anal", "oral", "pussy", "dick", "cock",
];

// Expanded education keywords
const educationKeywords = [
  "neet", "jee", "qualifier", "qualifiers", "iit", "nit", "iisc", "iim", "iiit",
  "school", "round 1", "allotment", "seats", "medical", "mbbs", "course", 
  "dates", "aspirants", "mock test", "mocks", "exam", "admission", "career", 
  "education", "learning", "academic", "curriculum", "training"
];

export async function fetchNewsByKeyword(keyword: string, limit: number = 6) {
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      keyword
    )}&language=en&apiKey=${"be76df14099e4cd286edf5e959907809"}`
  );
  if (!res.ok) throw new Error("Failed to fetch news");

  const data = await res.json();
  let articles = Array.isArray(data.articles) ? data.articles : [];

  // Filter articles internally
  articles = articles.filter(article => {
    const titleText = (article.title || "").toLowerCase();
    const descText = (article.description || "").toLowerCase();
    const combinedText = titleText + " " + descText;

    // 1️⃣ Must not contain banned words
    const clean = !bannedWords.some(word => combinedText.includes(word));

    // 2️⃣ At least 2 education keywords in the title
    const matchedKeywords = educationKeywords.filter(word => titleText.includes(word));
    const relevant = matchedKeywords.length >= 2;

    return clean && relevant;
  });

  return articles.slice(0, limit);
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

// Notifications version
export async function fetchEducationNews(limit: number = 5): Promise<NewsArticle[]> {
  try {
    const keywords = ["NEET", "JEE", "education", "career guidance", "college admission"];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    const articles = await fetchNewsByKeyword(randomKeyword, limit);
    return articles;
  } catch (error) {
    console.error("Error fetching education news:", error);
    return [];
  }
}
