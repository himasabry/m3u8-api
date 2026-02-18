import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { incrementViewer } from "./viewers.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id === id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    const headers = {
      "User-Agent": channel.headers?.["User-Agent"] || "SUPER2026",
      "Referer": channel.headers?.["Referer"] || "",
      "Origin": channel.headers?.["Origin"] || ""
    };

    const upstream = await fetch(channel.url, { headers });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/vnd.apple.mpegurl");

    upstream.body.pipe(res);

  } catch (e) {
    return res.status(500).send("Stream error: " + e.message);
  }
}
