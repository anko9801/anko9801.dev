import { z } from "zod";
import type { Article } from "./article";

const qiitaArticleSchema = z.array(
  z.object({
    title: z.string(),
    created_at: z.string(),
    url: z.string(),
  }),
);

export const ogImageFetcher = async (url: string) => {
  const response = await fetch(url);
  const text = await response.text();
  const ogImageUrl = text.match(
    /<meta property="og:image" content="(.+?)">/,
  )?.[1];
  return ogImageUrl?.replaceAll("&amp;", "&");
};

const qiitaApiEndpoint =
  "https://qiita.com/api/v2/users/anko_9801/items?per_page=100";

// FIXME: 100件までしか取得できない
export const fetchQiitaArticles = async (
  accessToken: string | undefined,
): Promise<Article[]> => {
  const requestUrl = qiitaApiEndpoint;

  try {
    const response = await fetch(requestUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const jsonResponse = await response.json();
    const qiitaArticles = qiitaArticleSchema.parse(jsonResponse);

    const ogImageUrls = await Promise.all(
      qiitaArticles.map((a) => ogImageFetcher(a.url)),
    );

    const articles: Article[] = qiitaArticles.map((article, i) => ({
      source: "qiita.com",
      url: article.url,
      title: article.title,
      postedAt: new Date(article.created_at),
      ogImageUrl: ogImageUrls[i],
    }));

    return articles;
  } catch (err) {
    console.error(err);
    return [];
  }
};