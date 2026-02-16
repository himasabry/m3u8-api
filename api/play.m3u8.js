import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  // 1️⃣ تحقق من User-Agent
  const userAgent = req.headers['user-agent'] || '';
  const REQUIRED_AGENT = "SUPER2026";
  if (!userAgent.includes(REQUIRED_AGENT)) {
    return res.status(403).send("Forbidden: Invalid User-Agent");
  }

  // 2️⃣ قراءة ملف القنوات
  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // 3️⃣ إيجاد القناة
  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  // 4️⃣ قناة ABR (جودات تلقائية)
  if (channel.streams) {
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

    return res.send(`#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=3840x2160
${channel.streams.high}

#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080
${channel.streams.mid}

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480
${channel.streams.low}
`);
  }

  // 5️⃣ قناة عادية
  res.redirect(channel.url);
}
