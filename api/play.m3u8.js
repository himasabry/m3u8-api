import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  // 1️⃣ تحقق من User-Agent
  const userAgent = req.headers['user-agent'] || '';
  const REQUIRED_AGENT = "SUPER2026"; // غير الاسم ده حسب اختيارك
  if (!userAgent.includes(REQUIRED_AGENT)) {
    return res.status(403).send("Forbidden: Invalid User-Agent");
  }

  // 2️⃣ قراءة ملف القنوات
  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // 3️⃣ إيجاد القناة حسب id
  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  // 4️⃣ اختيار رابط البث الصحيح
  // لو القناة ABR فيها master stream
  const targetUrl = channel.streams?.master 
                  || channel.streams?.high 
                  || channel.url; // fallback للقنوات العادية

  // 5️⃣ إرسال البث مع Headers
  res.writeHead(302, {
    Location: targetUrl,
    ...channel.headers // User-Agent, Referer, Origin
  });
  res.end();
}
