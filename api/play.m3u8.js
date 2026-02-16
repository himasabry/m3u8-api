import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const userAgent = req.headers['user-agent'] || '';
  const REQUIRED_AGENT = "SUPER2026";
  if (!userAgent.includes(REQUIRED_AGENT)) {
    return res.status(403).send("Forbidden");
  }

  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  // قناة ABR → نرسل Master Playlist يشير للـ Proxy
  if (channel.streams) {
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

    const host = `https://${req.headers.host}`;

    return res.send(`#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=3840x2160,CODECS="avc1.640028,mp4a.40.2"
${host}/api/proxy.m3u8?url=${encodeURIComponent(channel.streams.high)}

#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
${host}/api/proxy.m3u8?url=${encodeURIComponent(channel.streams.mid)}

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,CODECS="avc1.64001F,mp4a.40.2"
${host}/api/proxy.m3u8?url=${encodeURIComponent(channel.streams.low)}
`);
  }

  // القنوات العادية
  res.redirect(channel.url);
}
