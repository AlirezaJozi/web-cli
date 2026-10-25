const HTML_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** escape کردن کاراکترهای HTML در متن‌های ورودی قبل از ذخیره */
export function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[&<>"']/g, (c) => HTML_MAP[c]);
}

/** escape کردن کاراکترهای ویژه LIKE برای جستجوی امن */
export function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (m) => '\\' + m);
}
