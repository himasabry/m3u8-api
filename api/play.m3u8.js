export default async function handler(req, res) {
  const { id } = req.query;

  const channels = {
    "01": "https://xvg1xtr.m-2026-mobile.xyz/23_.m3u8",
    "02": "https://xvg1xtr.m-2026-mobile.xyz/24_.m3u8",
    "03": "https://xvg1xtr.m-2026-mobile.xyz/25_.m3u8",
    "04": "https://xvg1xtr.m-2026-mobile.xyz/26_.m3u8"
  };

  if (!channels[id]) {
    res.status(404).send("#EXTM3U\n# Channel not found");
    return;
  }

  try {
    const url = channels[id];
    const base = url.substring(0, url.lastIndexOf("/") + 1);

    const response = await fetch(url);
    let body = await response.text();

    // تحويل المسارات النسبية إلى مطلقة
    body = body.replace(
      /^(?!#)(.+)$/gm,
      line => line.startsWith("http") ? line : base + line
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(body);

  } catch (e) {
    res.status(500).send("#EXTM3U\n# Stream error");
  }
}
