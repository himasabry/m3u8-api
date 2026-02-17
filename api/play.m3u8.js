import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  const targetUrl =
    channel.streams?.master ||
    channel.streams?.high ||
    channel.url;

  try {
    const response = await fetch(targetUrl, {
      headers: channel.headers || {}
    });

    if (!response.ok) {
      return res.status(500).send("Stream fetch failed");
    }

    let body = await response.text();

    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
    body = body.replace(/^(?!#)(.+)$/gm, line => {
      if (line.startsWith("http")) return line;
      return baseUrl + line;
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(body);

  } catch (err) {
    res.status(500).send("Stream proxy error");
  }
}
