let viewers = {}; // العدادات في الذاكرة
let timers = {};  // لتتبع انتهاء الجلسة

export default function handler(req, res) {
  const { id } = req.query;

  if(!id) return res.status(400).json({error:"Missing id"});

  // إعطاء عداد المشاهدين الحالي للقناة
  return res.status(200).json({
    [id]: viewers[id] || 0
  });
}

// تابع زيادة المشاهدين (يستدعى من play.m3u8)
export function incrementViewer(id) {
  viewers[id] = (viewers[id] || 0) + 1;

  // إلغاء التايمر القديم إذا موجود
  if(timers[id]) clearTimeout(timers[id]);

  // ضبط تايمر 30 ثانية لإقصاء المشاهد إذا لم يحدث activity
  timers[id] = setTimeout(() => {
    viewers[id] = Math.max((viewers[id] || 1) - 1, 0);
  }, 30000); // 30 ثانية
}

// دالة لعرض كل القنوات (يمكن تعديلها للوحة التحكم)
export function getAllViewers() {
  return viewers;
}
