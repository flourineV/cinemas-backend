import axios from "axios";
import NodeCache from "node-cache";
import { config } from "../config";

const cache = new NodeCache();
const client = axios.create({
  baseURL: config.tmdb.baseURL,
  timeout: 10000,
  params: { api_key: config.tmdb.apiKey, language: config.tmdb.language },
});

export async function tmdbGet<T>(
  url: string,
  params?: any,
  ttlSec = 60
): Promise<T> {
  const key = `tmdb:${url}:${JSON.stringify(params || {})}`;
  const hit = cache.get<T>(key);
  if (hit) return hit;
  const { data } = await client.get<T>(url, { params });
  cache.set(key, data, ttlSec);
  return data;
}
