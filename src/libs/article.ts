import { fetchZennArticles } from "@/libs/zenn"
import { fetchQiitaArticles } from "./qiita"
import { fetchTrapArticles } from "./trap"

export type Article = {
  source: "qiita.com" | "zenn.dev" | "trap.jp"
  url: string
  title: string
  postedAt: Date
  ogImageUrl: string | undefined
};

export const getArticles = async () => {
  const ghostApiKey = import.meta.env.GHOST_ADMIN_API_KEY
  const qiitaAccessToken = import.meta.env.QIITA_ACCESS_TOKEN

  if (!ghostApiKey || !qiitaAccessToken) {
    throw new Error("API key is not set")
  }

  const articles = await Promise.all([
    fetchZennArticles(),
    fetchTrapArticles(ghostApiKey),
    fetchQiitaArticles(qiitaAccessToken),
  ]).then((articles) => articles.flat())

  articles.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())

  return articles;
};
