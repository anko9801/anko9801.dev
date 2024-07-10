import type { Article } from "@/libs/article";
import { z } from "zod";

const getPostsResponseSchema = z.object({
  posts: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      published_at: z.string(),
      feature_image: z.string().nullable(),
    }),
  ),
});

const searchParams = new URLSearchParams({
  includes: "authors",
  fields: "title,url,feature_image,published_at",
  filter: "authors.name:anko+status:published+visibility:public",
  limit: "all",
  order: "published_at desc",
});
const apiUrl = new URL("https://blog-admin.trap.jp/ghost/api/admin/posts");
apiUrl.search = searchParams.toString();

const getPosts = async (apiKey: string) => {
  const token = await sign(apiKey);

  const headers = { Authorization: `Ghost ${token}` };
  const res = await fetch(apiUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  const json = await res.json();
  const data = getPostsResponseSchema.parse(json);

  return data.posts;
};

export const fetchTrapArticles = async (apiKey: string) => {
  const posts = await getPosts(apiKey);

  const articles: Article[] = posts.map((post) => ({
    source: "trap.jp",
    url: post.url,
    title: post.title,
    postedAt: new Date(post.published_at),
    ogImageUrl: post.feature_image ?? undefined,
  }));

  return articles;
};

const encoder = new TextEncoder();

const encodeBase64 = (buf: ArrayBufferLike): string => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const encodeBase64Url = (buf: ArrayBufferLike): string =>
  encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m);

const encodeJwtPart = (part: unknown): string =>
  encodeBase64Url(encoder.encode(JSON.stringify(part))).replace(/=/g, "");
const encodeSignaturePart = (buf: ArrayBufferLike): string =>
  encodeBase64Url(buf).replace(/=/g, "");

const algorithm = {
  name: "HMAC",
  hash: {
    name: "SHA-256",
  },
};

export const sign = async (key: string): Promise<string> => {
  const [id, secret] = key.split(":");

  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + 300, aud: "/admin/" };
  const header = { alg: "HS256", typ: "JWT", kid: id };

  const encodedPayload = encodeJwtPart(payload);
  const encodedHeader = encodeJwtPart(header);

  const partialToken = `${encodedHeader}.${encodedPayload}`;

  const matchedSecrets = secret.match(/.{2}/g)
  if (matchedSecrets === null) {
    return 'not found';
  }
  const secretArray = Uint8Array.from(
    matchedSecrets.map((s) => Number.parseInt(s, 16)),
  );
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretArray,
    algorithm,
    false,
    ["sign"],
  );
  const signaturePart = await crypto.subtle.sign(
    algorithm,
    cryptoKey,
    encoder.encode(partialToken),
  );
  const signature = encodeSignaturePart(signaturePart);

  return `${partialToken}.${signature}`;
};