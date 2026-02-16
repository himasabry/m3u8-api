import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;

  // قراءة القنوات من الملف
  const filePath = path.join(process.cwd(), 'data', 'channels.json');
  const rawData = fs.readFileSync(filePath);
  const channelsData = JSON.parse(rawData);

  // البحث عن القناة حسب id
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

  // إصلاح روابط TS الداخلية لو لزم
  const base = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
  const response = await fetch(streamUrl);
  let body = await response.text();
  body = body.replace(/^(?!#)(.+)$/gm, line => line.startsWith("http") ? line : base + line);

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(body);
}
