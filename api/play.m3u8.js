import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id === id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    // لو فيه Headers → استخدم البروكسي
    if (channel.headers &&
       (channel.headers["User-Agent"] ||
        channel.headers["Referer"] ||
        channel.headers["Origin"])) {

      const params = new URLSearchParams({
        url: channel.url,
        ua: channel.headers["User-Agent"] || "",
        ref: channel.headers["Referer"] || "",
        org: channel.headers["Origin"] || ""
      });

      return res.redirect(`/api/proxy.m3u8.js?${params.toString()}`);
    }

    // قناة عادية → redirect مباشر
    return res.redirect(channel.url);

  } catch (e) {
    return res.status(500).send("Server error: " + e.message);
  }
}
