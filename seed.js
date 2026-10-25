/**
 * seed.js — ساخت ادمین اولیه (از env) + داده نمونه فارسی
 * اجرا: node seed.js
 */
import bcrypt from 'bcryptjs';
import { pool, query } from './src/config/db.js';
import { env } from './src/config/env.js';

const services = [
  {
    title: 'لیزر موهای زائد',
    slug: 'laser-hair-removal',
    category: 'لیزر',
    short_description: 'حذف موهای زائد با دستگاه لیزر دایود، مناسب انواع پوست',
    description:
      'لیزر موهای زائد یکی از مؤثرترین روش‌های کاهش دائمی موهای زائد است. در کلینیک ما از دستگاه لیزر دایود با سیستم خنک‌کننده پیشرفته استفاده می‌شود که برای انواع تیپ پوستی مناسب است. تعداد جلسات بسته به ناحیه و جنس مو معمولاً بین ۶ تا ۸ جلسه است.',
    duration: '۲۰ تا ۶۰ دقیقه بسته به ناحیه',
    recovery_time: 'بدون دوره نقاهت؛ بازگشت فوری به فعالیت روزانه',
    side_effects: [
      { title: 'قرمزی موقت', description: 'قرمزی و تورم خفیف پوست تا ۲۴ ساعت طبیعی است.' },
      { title: 'حساسیت به نور', description: 'پس از جلسه از قرار گرفتن در معرض آفتاب شدید خودداری کنید.' },
    ],
    faqs: [
      { question: 'لیزر موهای زائد چند جلسه لازم دارد؟', answer: 'معمولاً ۶ تا ۸ جلسه با فاصله ۴ تا ۶ هفته لازم است.' },
      { question: 'آیا لیزر درد دارد؟', answer: 'به‌لطف سیستم خنک‌کننده دستگاه، درد در حد خفیف و قابل تحمل است.' },
    ],
    sort_order: 1,
  },
  {
    title: 'جوان‌سازی پوست با RF فرکشنال',
    slug: 'rf-fractional-rejuvenation',
    category: 'جوان‌سازی',
    short_description: 'سفت‌سازی و جوان‌سازی پوست با امواج رادیویی فرکشنال',
    description:
      'آراف فرکشنال با تحریک کلاژن‌سازی عمقی، باعث سفت شدن پوست، کاهش چین‌وچروک ریز و بهبود بافت پوست می‌شود. این روش بدون جراحی و با دوره نقاهت کوتاه انجام می‌شود.',
    duration: '۴۵ تا ۶۰ دقیقه',
    recovery_time: '۲ تا ۳ روز قرمزی خفیف',
    side_effects: [
      { title: 'قرمزی و گرمای پوست', description: 'تا ۴۸ ساعت پس از درمان طبیعی است و برطرف می‌شود.' },
      { title: 'پوسته‌ریزی خفیف', description: 'احتمال پوسته‌ریزی نواحی درمان‌شده در روزهای نخست وجود دارد.' },
    ],
    faqs: [
      { question: 'نتایج آراف فرکشنال کی مشخص می‌شود؟', answer: 'نتایج اولیه پس از یک ماه و نتیجه نهایی پس از ۳ تا ۶ ماه نمایان می‌شود.' },
      { question: 'چند جلسه لازم است؟', answer: 'بسته به وضعیت پوست، معمولاً ۳ تا ۵ جلسه پیشنهاد می‌شود.' },
    ],
    sort_order: 2,
  },
  {
    title: 'تزریق ژل لب',
    slug: 'lip-filler',
    category: 'تزریقات',
    short_description: 'حجم‌دهی و فرم‌دهی لب با ژل‌های هیالورونیک اسید معتبر',
    description:
      'تزریق ژل لب با استفاده از فیلرهای هیالورونیک اسید دارای تأییدیه، برای حجم‌دهی، قرینه‌سازی و رفع خطوط دور لب انجام می‌شود. نتیجه بلافاصله قابل مشاهده است و ماندگاری آن ۶ تا ۱۲ ماه بسته به نوع ژل و متابولیسم فرد متفاوت است.',
    duration: '۳۰ دقیقه',
    recovery_time: '۱ تا ۲ روز تورم خفیف',
    side_effects: [
      { title: 'تورم و کبودی', description: 'تورم و کبودی محل تزریق تا ۴۸ ساعت طبیعی است.' },
      { title: 'عدم تقارن موقت', description: 'به‌دلیل تورم، ممکن است در روزهای اول عدم تقارن دیده شود.' },
    ],
    faqs: [
      { question: 'ماندگاری ژل لب چقدر است؟', answer: 'معمولاً بین ۶ تا ۱۲ ماه بسته به نوع ژل و سوخت‌وساز بدن.' },
      { question: 'آیا تزریق ژل درد دارد؟', answer: 'پیش از تزریق از بی‌حسی موضعی استفاده می‌شود و درد حداقل است.' },
    ],
    sort_order: 3,
  },
  {
    title: 'بوتاکس صورت',
    slug: 'botox-face',
    category: 'تزریقات',
    short_description: 'رفع خطوط پیشانی، خط اخم و خطوط دور چشم',
    description:
      'بوتاکس با شل کردن موقت عضلات هدف، خطوط اخم، خطوط پیشانی و خطوط دور چشم (پنجه کلاغی) را برطرف می‌کند. اثر آن ۳ تا ۷ روز پس از تزریق نمایان می‌شود و ۴ تا ۶ ماه ماندگاری دارد.',
    duration: '۲۰ دقیقه',
    recovery_time: 'بدون دوره نقاهت؛ تا ۴ ساعت دراز نکشید',
    side_effects: [
      { title: 'کبودی محل تزریق', description: 'کبودی خفیف در محل تزریق ممکن است چند روز باقی بماند.' },
      { title: 'سردرد موقت', description: 'در موارد نادر سردرد خفیف در ۲۴ ساعت اول گزارش شده است.' },
    ],
    faqs: [
      { question: 'بوتاکس چقدر ماندگاری دارد؟', answer: 'معمولاً ۴ تا ۶ ماه؛ با تکرار منظم ماندگاری بیشتر می‌شود.' },
      { question: 'از چه سنی می‌توان بوتاکس انجام داد؟', answer: 'معمولاً از ۲۵ سالگی به بعد و با تشخیص پزشک.' },
    ],
    sort_order: 4,
  },
  {
    title: 'میکرونیدلینگ',
    slug: 'microneedling',
    category: 'جوان‌سازی',
    short_description: 'بهبود جای جوش، منافذ باز و بافت پوست',
    description:
      'میکرونیدلینگ با ایجاد سوراخ‌های ریز کنترل‌شده در پوست، فرآیند ترمیم طبیعی و کلاژن‌سازی را تحریک می‌کند. این روش برای جای جوش، منافذ باز، لک‌های سطحی و خطوط ریز مؤثر است.',
    duration: '۴۰ دقیقه',
    recovery_time: '۱ تا ۲ روز قرمزی شبیه آفتاب‌سوختگی',
    side_effects: [
      { title: 'قرمزی پوست', description: 'قرمزی تا ۴۸ ساعت پس از جلسه طبیعی است.' },
      { title: 'خشکی و پوسته‌ریزی', description: 'استفاده از مرطوب‌کننده تجویزشده در روزهای اول الزامی است.' },
    ],
    faqs: [
      { question: 'میکرونیدلینگ چند جلسه لازم دارد؟', answer: 'برای جای جوش معمولاً ۴ تا ۶ جلسه با فاصله یک ماه.' },
      { question: 'آیا بعد از میکرونیدلینگ می‌توان آرایش کرد؟', answer: 'تا ۲۴ ساعت پس از جلسه آرایش توصیه نمی‌شود.' },
    ],
    sort_order: 5,
  },
  {
    title: 'پاکسازی پوست (هیدروفیشیال)',
    slug: 'hydrafacial',
    category: 'پاکسازی',
    short_description: 'پاکسازی عمیق، آبرسانی و شاداب‌سازی پوست در یک جلسه',
    description:
      'هیدروفیشیال ترکیبی از پاکسازی، لایه‌برداری، تخلیه جوش‌های سرسیاه و آبرسانی عمقی پوست است. این روش بدون درد و بدون دوره نقاهت بوده و نتیجه آن بلافاصله قابل مشاهده است.',
    duration: '۵۰ دقیقه',
    recovery_time: 'ندارد',
    side_effects: [
      { title: 'حساسیت موقت', description: 'احتمال حساسیت خفیف پوست در ساعات اول وجود دارد.' },
    ],
    faqs: [
      { question: 'هیدروفیشیال هر چند وقت یک‌بار توصیه می‌شود؟', answer: 'برای حفظ نتیجه، ماهی یک جلسه پیشنهاد می‌شود.' },
      { question: 'آیا هیدروفیشیال برای پوست حساس مناسب است؟', answer: 'بله، با تنظیم درجه مکش و مواد مصرفی، برای پوست حساس نیز قابل انجام است.' },
    ],
    sort_order: 6,
  },
];

const clinicInfo = {
  name: 'کلینیک زیبایی نگار',
  about:
    'کلینیک زیبایی نگار با بهره‌گیری از پزشکان متخصص و دستگاه‌های روز دنیا، خدمات پوست، مو و زیبایی را با بالاترین استانداردها ارائه می‌دهد.',
  address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳، طبقه ۴',
  phones: ['02188776655', '09121234567'],
  email: 'info@negar-clinic.local',
  instagram_url: 'https://instagram.com/negar.clinic',
  map_lat: 35.7736,
  map_lng: 51.4107,
  working_hours: [
    { day: 'شنبه', closed: false, slots: [{ open: '09:00', close: '13:00' }, { open: '16:00', close: '20:00' }] },
    { day: 'یکشنبه', closed: false, slots: [{ open: '09:00', close: '13:00' }, { open: '16:00', close: '20:00' }] },
    { day: 'دوشنبه', closed: false, slots: [{ open: '09:00', close: '13:00' }, { open: '16:00', close: '20:00' }] },
    { day: 'سه‌شنبه', closed: false, slots: [{ open: '09:00', close: '13:00' }, { open: '16:00', close: '20:00' }] },
    { day: 'چهارشنبه', closed: false, slots: [{ open: '09:00', close: '13:00' }, { open: '16:00', close: '20:00' }] },
    { day: 'پنجشنبه', closed: false, slots: [{ open: '09:00', close: '14:00' }] },
    { day: 'جمعه', closed: true, slots: [] },
  ],
};

async function seed() {
  console.log('🌱 شروع seed...');

  // ۱) ادمین اولیه از env
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await query(
    `INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [env.ADMIN_EMAIL.toLowerCase(), passwordHash]
  );
  console.log(`✔ ادمین ساخته/به‌روزرسانی شد: ${env.ADMIN_EMAIL}`);

  // ۲) خدمات (در اجرای مجدد، داده‌ها جایگزین می‌شوند)
  await query('DELETE FROM before_after');
  await query('DELETE FROM services');
  for (const s of services) {
    await query(
      `INSERT INTO services
       (title, slug, category, short_description, description, cover_image,
        duration, recovery_time, side_effects, faqs, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        s.title, s.slug, s.category, s.short_description, s.description,
        `/uploads/${s.slug}.jpg`, s.duration, s.recovery_time,
        JSON.stringify(s.side_effects), JSON.stringify(s.faqs), s.sort_order,
      ]
    );
  }
  console.log(`✔ ${services.length} خدمت نمونه ساخته شد`);

  // ۳) نمونه قبل/بعد برای اولین خدمت
  const [firstService] = await query('SELECT id FROM services ORDER BY sort_order ASC LIMIT 1');
  for (let i = 1; i <= 2; i++) {
    await query(
      `INSERT INTO before_after (service_id, before_image, after_image, caption, is_published, sort_order)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [
        firstService.id,
        `/uploads/sample-before-${i}.jpg`,
        `/uploads/sample-after-${i}.jpg`,
        `نمونه ${i} — نتیجه پس از ۶ جلسه`,
        i,
      ]
    );
  }
  console.log('✔ ۲ نمونه قبل/بعد ساخته شد');

  // ۴) اطلاعات کلینیک
  const c = clinicInfo;
  await query(
    `INSERT INTO clinic_info
       (id, name, about, address, phones, email, instagram_url, map_lat, map_lng, working_hours)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), about = VALUES(about), address = VALUES(address),
       phones = VALUES(phones), email = VALUES(email), instagram_url = VALUES(instagram_url),
       map_lat = VALUES(map_lat), map_lng = VALUES(map_lng), working_hours = VALUES(working_hours)`,
    [
      c.name, c.about, c.address,
      JSON.stringify(c.phones), c.email, c.instagram_url,
      c.map_lat, c.map_lng, JSON.stringify(c.working_hours),
    ]
  );
  console.log('✔ اطلاعات کلینیک ذخیره شد');

  console.log('✅ seed با موفقیت پایان یافت');
}

seed()
  .catch((err) => {
    console.error('❌ خطا در seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
