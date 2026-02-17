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

  let targetUrl = channel.url;

  // 4️⃣ اختيار الجودة تلقائي للقنوات متعددة الجودات
  if (channel.streams) {

    const saveData = req.headers['save-data'];
    const connection = req.headers['connection'] || "";

    // اختيار ذكي
    if (saveData === "on") {
      targetUrl = channel.streams.low;
    } else if (connection.includes("3g")) {
      targetUrl = channel.streams.low;
    } else if (connection.includes("4g")) {
      targetUrl = channel.streams.mid;
    } else {
      targetUrl = channel.streams.high;
    }
  }

  // 5️⃣ إعادة التوجيه
  res.writeHead(302, {
    Location: targetUrl,
    ...channel.headers
  });
  res.end();
}
