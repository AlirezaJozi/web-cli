const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'; // ارقام فارسی
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'; // ارقام عربی

/** تبدیل ارقام فارسی/عربی به انگلیسی */
export function toEnglishDigits(input) {
  return String(input).replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA_DIGITS.indexOf(d);
    return String(fa >= 0 ? fa : AR_DIGITS.indexOf(d));
  });
}

/**
 * نرمال‌سازی شماره موبایل ایران به فرم 09xxxxxxxxx
 * پشتیبانی از +98، 0098، 98 و ارقام فارسی/عربی
 * در صورت نامعتبر بودن null برمی‌گرداند
 */
export function normalizeIranMobile(input) {
  let v = toEnglishDigits(input).replace(/[\s\-().]/g, '');
  if (v.startsWith('+98')) v = '0' + v.slice(3);
  else if (v.startsWith('0098')) v = '0' + v.slice(4);
  else if (/^98\d{10}$/.test(v)) v = '0' + v.slice(2);
  return /^09\d{9}$/.test(v) ? v : null;
}
