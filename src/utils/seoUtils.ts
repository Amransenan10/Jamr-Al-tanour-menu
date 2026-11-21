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
  meta_title: 'جمر التنور | المنيو الإلكتروني والطلب أونلاين',
  meta_description: 'مطعم جمر التنور - المنيو الإلكتروني الرسمي. تصفح الفطائر، البيتزا، الشاورما، البرجر، الفطور، الفلافل، والمشروبات واطلب أونلاين مع خدمة التوصيل والاستلام.',
  meta_keywords: 'جمر التنور, منيو جمر التنور, مطعم جمر التنور, فطائر, بيتزا, شاورما, برجر, فلافل, فطور, منيو الكتروني, مطاعم الرياض',
  og_image: 'https://jamraltanour.com/assets/logo.png',
  canonical_url: 'https://jamraltanour.com/',
  robots_index: true,
  restaurant_name: 'جمر التنور',
  restaurant_cuisine: 'فطائر، بيتزا، شاورما، برجر، فطور، فلافل، مقبلات',
  restaurant_phone: '',
  restaurant_address: 'الرياض',
  business_hours: '',
  google_site_verification: '',
  enable_rich_schema: true
};

export const DEFAULT_SEO_ARTICLES: SeoArticle[] = [];

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

  // 3. Open Graph
  setMeta('property', 'og:title', seo.meta_title);
  setMeta('property', 'og:description', seo.meta_description);
  setMeta('property', 'og:image', seo.og_image);
  setMeta('property', 'og:url', seo.canonical_url || window.location.origin);
  setMeta('property', 'og:site_name', seo.restaurant_name || 'جمر التنور');

  // 4. Twitter Card
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

    const cuisines = (seo.restaurant_cuisine || "Pies, Pizza, Shawarma, Burger, Falafel")
      .split(/[،,]/)
      .map(s => s.trim())
      .filter(Boolean);

    const schemaData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": seo.restaurant_name || "جمر التنور",
      "description": seo.meta_description,
      "image": seo.og_image,
      "url": seo.canonical_url || window.location.origin,
      "priceRange": "$$"
    };

    if (seo.restaurant_phone) {
      schemaData["telephone"] = seo.restaurant_phone;
    }

    if (cuisines.length > 0) {
      schemaData["servesCuisine"] = cuisines;
    }

    if (seo.restaurant_address) {
      schemaData["address"] = {
        "@type": "PostalAddress",
        "streetAddress": seo.restaurant_address,
        "addressLocality": "Riyadh",
        "addressCountry": "SA"
      };
    }

    if (seo.business_hours) {
      schemaData["openingHours"] = seo.business_hours;
    }

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

  // 1. Title check
  const titleLen = (seo.meta_title || '').trim().length;
  const titleOk = titleLen >= 25 && titleLen <= 70;
  if (titleOk) score += 25;
  else if (titleLen > 0) score += 10;
  checks.push({
    label: 'عنوان الصفحة (Title Tag)',
    passed: titleOk,
    tip: titleLen < 25 ? 'العنوان قصير.' : titleLen > 70 ? 'العنوان طويل.' : 'طول العنوان مناسب.'
  });

  // 2. Description check
  const descLen = (seo.meta_description || '').trim().length;
  const descOk = descLen >= 70 && descLen <= 170;
  if (descOk) score += 25;
  else if (descLen > 0) score += 12;
  checks.push({
    label: 'الوصف التعريفي (Meta Description)',
    passed: descOk,
    tip: descLen < 70 ? 'الوصف قصير.' : descLen > 170 ? 'الوصف طويل.' : 'طول الوصف مناسب.'
  });

  // 3. Keywords check
  const kwList = (seo.meta_keywords || '').split(/[،,]/).map(k => k.trim()).filter(Boolean);
  const kwOk = kwList.length >= 3;
  if (kwOk) score += 20;
  else if (kwList.length > 0) score += 10;
  checks.push({
    label: 'الكلمات المفتاحية',
    passed: kwOk,
    tip: kwOk ? `تم تحديد ${kwList.length} كلمات مفتاحية.` : 'حدد 3 كلمات مفتاحية على الأقل تفصل بينها بفواصل.'
  });

  // 4. Social Sharing image
  const imgOk = Boolean(seo.og_image && seo.og_image.startsWith('http'));
  if (imgOk) score += 15;
  checks.push({
    label: 'صورة المشاركة (Social Image)',
    passed: imgOk,
    tip: imgOk ? 'رابط الصورة موجود.' : 'يرجى وضع رابط الصورة.'
  });

  // 5. Local Schema & Business data
  const schemaOk = Boolean(seo.enable_rich_schema && seo.restaurant_name);
  if (schemaOk) score += 15;
  checks.push({
    label: 'بيانات المطعم (Schema)',
    passed: schemaOk,
    tip: schemaOk ? 'اسم المطعم محدد.' : 'أدخل اسم المطعم لتفعيل السكيما.'
  });

  return {
    score: Math.min(100, score),
    checks
  };
}
