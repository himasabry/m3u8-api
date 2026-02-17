import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id, q } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const userAgent = req.headers['user-agent'] || '';
  const REQUIRED_AGENT = "SUPER2026";
  if (!userAgent.includes(REQUIRED_AGENT)) {
    return res.status(403).send("Forbidden: Invalid User-Agent");
  }

  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  let targetUrl = channel.url;

  // قنوات متعددة الجودات
  if (channel.streams) {
    if (q === "low") targetUrl = channel.streams.low;
    else if (q === "mid") targetUrl = channel.streams.mid;
    else if (q === "high") targetUrl = channel.streams.high;
    else {
      // Auto ذكي
      const saveData = req.headers['save-data'];
      const connection = req.headers['connection'] || "";

      if (saveData === "on") targetUrl = channel.streams.low;
      else if (connection.includes("3g")) targetUrl = channel.streams.low;
      else if (connection.includes("4g")) targetUrl = channel.streams.mid;
      else targetUrl = channel.streams.high;
    }
  }

  // هل القناة تحتاج proxy ؟
  if (channel.headers && Object.values(channel.headers).some(v => v)) {
    return res.redirect(
      `/api/proxy.m3u8?url=${encodeURIComponent(targetUrl)}`
    );
  }

  res.redirect(targetUrl);
}
