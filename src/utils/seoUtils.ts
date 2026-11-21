export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string;
  canonical_url: string;
  robots_index: boolean;
  restaurant_name: string;
  restaurant_cuisine: string;
  restaurant_phone: string;
  restaurant_address: string;
  business_hours: string;
  google_site_verification: string;
  enable_rich_schema: boolean;
}

export interface SeoArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  keywords: string;
  published: boolean;
  views_count?: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  meta_title: 'جمر التنور | المنيو الإلكتروني والطلب أونلاين - أفضل فطائر ومشاوي بالرياض',
  meta_description: 'مطعم جمر التنور - المنيو الإلكتروني الرسمي. تصفح أشهى الفطائر على الفحم، الشاورما، الفلافل، والمقبلات. اطلب أونلاين بسهولة مع خدمة التوصيل السريع والاستلام من الفرع.',
  meta_keywords: 'جمر التنور, منيو جمر التنور, مطعم جمر التنور بالرياض, مشاوي على الفحم, فطائر تنور, شاورما, فلافل, منيو الكتروني, مطاعم السويدي, توصيل طلبات',
  og_image: 'https://jamraltanour.com/assets/logo.png',
  canonical_url: 'https://jamraltanour.com/',
  robots_index: true,
  restaurant_name: 'جمر التنور',
  restaurant_cuisine: 'فطائر ومشويات ومأكولات شرقية وسريعة',
  restaurant_phone: '0500000000',
  restaurant_address: 'الرياض - السويدي الغربي',
  business_hours: 'يومياً من 12:00 ظهراً حتى 02:00 صباحاً',
  google_site_verification: '',
  enable_rich_schema: true
};

export const DEFAULT_SEO_ARTICLES: SeoArticle[] = [
  {
    id: 'art_1',
    title: 'سر النكهة الأصيلة في فطائر ومشويات جمر التنور',
    slug: 'secret-of-jamr-altanour-taste',
    category: 'قصتنا ومطبخنا',
    summary: 'تعرف على سر تسوية العجين على نار الحطب والجمر الهادئ وكيف نحافظ على أعلى معايير الجودة والنضارة يومياً في فروع جمر التنور.',
    content: 'في مطعم جمر التنور نحرص كل صباح على اختيار أجود أنواع اللحوم الطازجة والدقيق الفاخر لإعداد أشهى الفطائر والمشويات. التخمير الطبيعي ودرجة حرارة التنور المصنوع من الطين البركاني تمنح العجين قرمشة ذهبية لا تُقاوم مع حفاظ اللحم على عصارته ونكهته الأصلية المدخنة.',
    image_url: 'https://jamraltanour.com/assets/logo.png',
    keywords: 'فطائر تنور, مشاوي بالرياض, أكل طازج, منيو جمر التنور',
    published: true,
    views_count: 342,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'art_2',
    title: 'دليل اختيار الوجبة المثالية لجمعات العائلة والأصدقاء',
    slug: 'family-gathering-meal-guide',
    category: 'دليل واقتراحات',
    summary: 'اكتشف أفضل بوكسات العائلة وتشكيلات الفطائر والشاورما الموفرة التي تناسب سهراتكم وتجمعاتكم مع خدمة التوصيل السريع.',
    content: 'سواء كنت تخطط لجمعة عائلية في عطلة نهاية الأسبوع أو اجتماع عمل في المكتب، نوفر لك بوكسات المشاركة المشكلة من الفطائر، الشاورما، والمقبلات المتنوعة مع صوصاتنا الخاصة وخبز التنور الساخن مباشرة من الفرن إلى مائدتك.',
    image_url: 'https://jamraltanour.com/assets/logo.png',
    keywords: 'بوكسات عائلية, بوكس شاورما, عشاء عائلي, مطاعم الرياض',
    published: true,
    views_count: 218,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * Apply SEO meta tags dynamically to the document head
 */
export function applySeoSettings(settings?: Partial<SeoSettings>) {
  if (typeof document === 'undefined') return;
  const seo = { ...DEFAULT_SEO_SETTINGS, ...(settings || {}) };

  // 1. Document Title
  if (seo.meta_title) {
    document.title = seo.meta_title;
  }

  // Helper to set or create meta tag
  const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 2. Primary Meta Tags
  setMeta('name', 'title', seo.meta_title);
  setMeta('name', 'description', seo.meta_description);
  setMeta('name', 'keywords', seo.meta_keywords);
  setMeta('name', 'robots', seo.robots_index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
  if (seo.google_site_verification) {
    setMeta('name', 'google-site-verification', seo.google_site_verification);
  }

  // 3. Open Graph (WhatsApp, Facebook, LinkedIn)
  setMeta('property', 'og:title', seo.meta_title);
  setMeta('property', 'og:description', seo.meta_description);
  setMeta('property', 'og:image', seo.og_image);
  setMeta('property', 'og:url', seo.canonical_url || window.location.origin);
  setMeta('property', 'og:site_name', seo.restaurant_name || 'جمر التنور');

  // 4. Twitter / X Card
  setMeta('name', 'twitter:title', seo.meta_title);
  setMeta('name', 'twitter:description', seo.meta_description);
  setMeta('name', 'twitter:image', seo.og_image);
  setMeta('name', 'twitter:card', 'summary_large_image');

  // 5. Canonical link
  if (seo.canonical_url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.canonical_url);
  }

  // 6. Local Business Schema (JSON-LD)
  if (seo.enable_rich_schema) {
    let schemaScript = document.querySelector('script[data-dynamic-seo="true"]') as HTMLScriptElement;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('data-dynamic-seo', 'true');
      document.head.appendChild(schemaScript);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": seo.restaurant_name || "جمر التنور",
      "description": seo.meta_description,
      "image": seo.og_image,
      "url": seo.canonical_url || window.location.origin,
      "telephone": seo.restaurant_phone || "",
      "servesCuisine": (seo.restaurant_cuisine || "Arabic, Middle Eastern, Pies").split(',').map(s => s.trim()),
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": seo.restaurant_address || "الرياض",
        "addressLocality": "Riyadh",
        "addressCountry": "SA"
      },
      "openingHours": seo.business_hours || "Mo-Su 12:00-02:00"
    };

    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
  }
}

/**
 * Calculates SEO strength score (0 to 100%) and provides actionable advice
 */
export function calculateSeoScore(settings?: Partial<SeoSettings>) {
  const seo = { ...DEFAULT_SEO_SETTINGS, ...(settings || {}) };
  let score = 0;
  const checks: { label: string; passed: boolean; tip: string }[] = [];

  // 1. Title check (ideal: 40 - 70 chars)
  const titleLen = (seo.meta_title || '').trim().length;
  const titleOk = titleLen >= 35 && titleLen <= 70;
  if (titleOk) score += 25;
  else if (titleLen > 0) score += 10;
  checks.push({
    label: 'عنوان الصفحة (Title Tag)',
    passed: titleOk,
    tip: titleLen < 35 ? 'العنوان قصير جداً، حاول إضافة اسم الفرع أو تخصص المطعم.' : titleLen > 70 ? 'العنوان طويل جداً وقد يقتطعه قوقل بالنقاط (...).' : 'طول العنوان مثالي جداً لنتائج البحث (بين 35 و 70 حرفاً).'
  });

  // 2. Description check (ideal: 110 - 165 chars)
  const descLen = (seo.meta_description || '').trim().length;
  const descOk = descLen >= 100 && descLen <= 170;
  if (descOk) score += 25;
  else if (descLen > 0) score += 12;
  checks.push({
    label: 'الوصف التعريفي (Meta Description)',
    passed: descOk,
    tip: descLen < 100 ? 'الوصف قصير، أضف تفاصيل عن الأصناف، التوصيل، وجودة الطعام.' : descLen > 170 ? 'الوصف طويل بعض الشيء، الأفضل أن يكون أقل من 165 حرفاً.' : 'طول الوصف مثالي لمحركات البحث وتطبيقات المراسلة.'
  });

  // 3. Keywords check (at least 3 keywords)
  const kwList = (seo.meta_keywords || '').split(',').map(k => k.trim()).filter(Boolean);
  const kwOk = kwList.length >= 4;
  if (kwOk) score += 20;
  else if (kwList.length > 0) score += 10;
  checks.push({
    label: 'الكلمات المفتاحية المستهدفة',
    passed: kwOk,
    tip: kwOk ? `تم تحديد ${kwList.length} كلمات مفتاحية بنجاح.` : 'يُفضل إضافة 4 كلمات مفتاحية على الأقل تفصل بينها بفواصل.'
  });

  // 4. Social Sharing & Logo image
  const imgOk = Boolean(seo.og_image && seo.og_image.startsWith('http'));
  if (imgOk) score += 15;
  checks.push({
    label: 'صورة المشاركة (Social Image)',
    passed: imgOk,
    tip: imgOk ? 'الصورة جاهزة وستظهر في معاينات واتساب وتويتر.' : 'يرجى وضع رابط صورة بدقة جيدة تظهر عند مشاركة الرابط.'
  });

  // 5. Local Schema & Business data
  const schemaOk = Boolean(seo.enable_rich_schema && seo.restaurant_name && seo.restaurant_phone);
  if (schemaOk) score += 15;
  checks.push({
    label: 'بيانات المطعم المنظمة (Schema)',
    passed: schemaOk,
    tip: schemaOk ? 'بيانات المطعم جاهزة لمساعدة قوقل على إبراز موقعك وساعات عملك.' : 'أكمل اسم المطعم ورقم الهاتف لتفعيل كود السكيما بالكامل.'
  });

  return {
    score: Math.min(100, score),
    checks
  };
}
