import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // قراءة ملف القنوات
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const rawData = fs.readFileSync(filePath, "utf8");
    const channelsData = JSON.parse(rawData);

    // البحث عن القناة
    let streamUrl = null;
    for (const cat in channelsData) {
      const ch = channelsData[cat].find(c => c.id === id);
      if (ch) {
        streamUrl = ch.url;
        break;
      }
    }

    if (!streamUrl) {
      res.status(404).send("#EXTM3U\n# Channel not found");
      return;
    }

    // جلب البث مع هيدرز احترافية
    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        "Referer": new URL(streamUrl).origin + "/",
        "Origin": new URL(streamUrl).origin
      }
    });

    let body = await response.text();

    // لو رجّع رابط مباشر
    if (body.startsWith("http")) {
      body = `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=8000000\n${body}`;
    }

    // إصلاح المسارات النسبية
    const base = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
    body = body.replace(
      /^(?!#)(.+)$/gm,
      line => (line.startsWith("http") ? line : base + line)
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(body);
  } catch (e) {
    res.status(500).send("#EXTM3U\n# Stream error");
  }
}
