import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const data = await kv.get('channels') || {};
  res.json(data);
}
