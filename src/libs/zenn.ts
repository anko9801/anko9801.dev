import type { Article } from "@/libs/article";
import { z } from "zod";

const zennArticlesSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      path: z.string(),
      published_at: z.string(),
    }),
  ),
});

const zennArticleSchema = z.object({
  article: z.object({ og_image_url: z.string() }),
});

const zennApiEndpoint = "https://zenn.dev/api/articles?username=anko&count=100";

export const fetchZennArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(zennApiEndpoint, {cache: 'no-store'});
    const jsonResponse = await response.json();

    const { articles: zennArticles } = zennArticlesSchema.parse(jsonResponse);

    const ogImageUrls = await Promise.all(
      zennArticles.map(async (article) => {
        const res = await fetch(
          `https://zenn.dev/api/articles/${article.slug}`,
        );
        const json = await res.json();

        const articleResponse = zennArticleSchema.parse(json);
        const ogImageUrl = articleResponse.article.og_image_url;
        return ogImageUrl;
      }),
    );

    const articles: Article[] = zennArticles.map((a, i) => ({
      source: "zenn.dev",
      title: a.title,
      url: `https://zenn.dev${a.path}`,
      postedAt: new Date(a.published_at),
      ogImageUrl: ogImageUrls[i],
    }));

    return articles;
  } catch (err) {
    console.error(err);
    return [];
  }
};