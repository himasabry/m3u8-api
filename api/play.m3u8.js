import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// 🔥 User Agents
const NEW_UA = "SUPER2026";
const OLD_UA = "SUPERTVLIVE2026";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing id");
    }

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    incrementViewer(id);

    // =========================
    // 🔴 المصيدة
    // =========================
    if (
      ua.includes(OLD_UA.toLowerCase()) ||
      ua.includes("superlivetv")
    ) {
      return res.redirect(
        "https://github.com/himasabry/video/raw/refs/heads/main/output.m3u8"
      );
    }

    // =========================
    // ❌ منع أي يوزر غير المسموح
    // =========================
    if (!ua.includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =========================
    // 📦 تحميل القنوات
    // =========================
    const filePath = path.join(
      process.cwd(),
      "data",
      "channels.json"
    );

    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    let channel = null;

    for (const group of Object.values(data)) {
      const found = group.find(
        (ch) => ch.id === id
      );

      if (found) {
        channel = found;
        break;
      }
    }

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    // =========================
    // 🔥 هيدرز القناة
    // =========================
    const headers = {};

    if (channel.headers?.["User-Agent"]) {
      headers["User-Agent"] =
        channel.headers["User-Agent"];
    }

    if (channel.headers?.Referer) {
      headers["Referer"] =
        channel.headers.Referer;
    }

    if (channel.headers?.Origin) {
      headers["Origin"] =
        channel.headers.Origin;
    }

    // =========================
    // 📡 جلب البث الحقيقي
    // =========================
    const response = await fetch(
      channel.url.split("#")[0],
      {
        headers,
        redirect: "follow"
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .send("Source error");
    }

    // =========================
    // 📺 رجع الـ m3u8 نفسه
    // =========================
    const body =
      await response.text();

    res.setHeader(
      "Content-Type",
      response.headers.get(
        "content-type"
      ) ||
      "application/vnd.apple.mpegurl"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.send(body);

  } catch (e) {
    console.error(e);

    return res
      .status(500)
      .send("Server error");
  }
}
