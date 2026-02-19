import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, ua, ref, org } = req.query;

  if (!url) return res.status(400).send("Missing url");

  try {
    const headers = {};

    if (ua) headers["User-Agent"] = ua;
    if (ref) headers["Referer"] = ref;
    if (org) headers["Origin"] = org;

    // دعم Range (مهم للبث)
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const upstream = await fetch(url, {
      headers,
      redirect: "follow",
      timeout: 15000
    });

    // تمرير status + headers
    res.status(upstream.status);

    // Headers أساسية
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Cache-Control", "no-store");

    upstream.headers.forEach((v, k) => {
      if (
        ![
          "content-encoding",
          "transfer-encoding",
          "connection",
          "keep-alive"
        ].includes(k.toLowerCase())
      ) {
        res.setHeader(k, v);
      }
    });

    upstream.body.pipe(res);

  } catch (e) {
    console.error("PROXY ERROR:", e);
    res.status(500).send("Proxy error");
  }
}
