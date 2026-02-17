export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Missing id");
  }

  // اختبار بسيط
  return res.redirect("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
}
