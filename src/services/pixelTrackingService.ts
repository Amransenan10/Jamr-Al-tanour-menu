/**
 * Unified Marketing Pixels Tracking Service for Jamr Al Tanour
 * Supports Snapchat Pixel, TikTok Pixel, Meta Pixel (Facebook/Instagram), and Google Analytics 4 (GA4).
 * Handles dynamic script injection, consent, and standard e-commerce events.
 */

export interface MarketingPixelsConfig {
  snapchat_pixel_id?: string;
  snapchat_enabled?: boolean;
  tiktok_pixel_id?: string;
  tiktok_enabled?: boolean;
  meta_pixel_id?: string;
  meta_enabled?: boolean;
  ga4_measurement_id?: string;
  ga4_enabled?: boolean;
}

const STORAGE_PIXELS_KEY = 'jamr_marketing_pixels_config';

// Global flags to prevent multiple script tag injections
let snapchatInjected = false;
let tiktokInjected = false;
let metaInjected = false;
let ga4Injected = false;

// In-memory active configuration
let activeConfig: MarketingPixelsConfig = {};

/** Load saved pixel configuration from localStorage or default */
export const getSavedPixelConfig = (): MarketingPixelsConfig => {
  const defaultConfig: MarketingPixelsConfig = {
    meta_pixel_id: '1775427600349485',
    meta_enabled: true,
    snapchat_enabled: true,
    tiktok_enabled: true,
    ga4_enabled: true
  };

  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(STORAGE_PIXELS_KEY);
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Error reading pixel config cache:', e);
  }
  return defaultConfig;
};

/** Save pixel configuration to local storage */
export const savePixelConfigLocal = (config: MarketingPixelsConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PIXELS_KEY, JSON.stringify(config));
    activeConfig = { ...activeConfig, ...config };
  } catch (e) {}
};

/** Inject Snapchat Pixel */
const injectSnapchatPixel = (pixelId: string) => {
  if (snapchatInjected || typeof window === 'undefined' || !pixelId) return;
  try {
    (function(e: any, t: any, n: any) {
      if (e.snaptr) return;
      const a: any = e.snaptr = function() {
        a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
      };
      a.queue = [];
      const s = 'script';
      const r = t.createElement(s);
      r.async = true;
      r.src = n;
      const u = t.getElementsByTagName(s)[0];
      if (u && u.parentNode) {
        u.parentNode.insertBefore(r, u);
      } else {
        document.head.appendChild(r);
      }
    })(window, document, 'https://sc-static.net/scevent.min.js');

    if ((window as any).snaptr) {
      (window as any).snaptr('init', pixelId);
    }
    snapchatInjected = true;
    console.log('[Pixels] Snapchat Pixel initialized:', pixelId);
  } catch (err) {
    console.warn('[Pixels] Snapchat init error:', err);
  }
};

/** Inject TikTok Pixel */
const injectTikTokPixel = (pixelId: string) => {
  if (tiktokInjected || typeof window === 'undefined' || !pixelId) return;
  try {
    (function(w: any, d: any, t: any) {
      w.TiktokAnalyticsObject = t;
      const ttq = w[t] = w[t] || [];
      ttq.methods = [
        "page", "track", "identify", "instances", "debug", "on", "off", "once", "ready",
        "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"
      ];
      ttq.setAndDefer = function(t: any, e: any) {
        t[e] = function() {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function(t: any) {
        const e = ttq._i[t] || [];
        for (let n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(e, ttq.methods[n]);
        }
        return e;
      };
      ttq.load = function(e: any, n: any) {
        const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = r;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        const c = document.createElement("script");
        c.type = "text/javascript";
        c.async = true;
        c.src = r + "?sdkid=" + e + "&lib=" + t;
        const a = document.getElementsByTagName("script")[0];
        if (a && a.parentNode) {
          a.parentNode.insertBefore(c, a);
        } else {
          document.head.appendChild(c);
        }
      };
    })(window, document, 'ttq');

    if ((window as any).ttq) {
      (window as any).ttq.load(pixelId);
      (window as any).ttq.page();
    }
    tiktokInjected = true;
    console.log('[Pixels] TikTok Pixel initialized:', pixelId);
  } catch (err) {
    console.warn('[Pixels] TikTok init error:', err);
  }
};

/** Inject Meta (Facebook & Instagram) Pixel */
const injectMetaPixel = (pixelId: string) => {
  if (metaInjected || typeof window === 'undefined' || !pixelId) return;
  try {
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        document.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    if ((window as any).fbq) {
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
    }
    metaInjected = true;
    console.log('[Pixels] Meta Pixel initialized:', pixelId);
  } catch (err) {
    console.warn('[Pixels] Meta init error:', err);
  }
};

/** Inject Google Analytics 4 */
const injectGA4 = (measurementId: string) => {
  if (ga4Injected || typeof window === 'undefined' || !measurementId) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    function gtag(...args: any[]) {
      win.dataLayer.push(args);
    }
    win.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: true
    });

    ga4Injected = true;
    console.log('[Pixels] Google Analytics 4 initialized:', measurementId);
  } catch (err) {
    console.warn('[Pixels] GA4 init error:', err);
  }
};

/** Initialize all configured and enabled marketing pixels */
export const initMarketingPixels = (config?: MarketingPixelsConfig): void => {
  if (typeof window === 'undefined') return;

  const conf = config || getSavedPixelConfig();
  activeConfig = conf;

  // Snapchat
  if (conf.snapchat_enabled && conf.snapchat_pixel_id) {
    injectSnapchatPixel(conf.snapchat_pixel_id.trim());
  }

  // TikTok
  if (conf.tiktok_enabled && conf.tiktok_pixel_id) {
    injectTikTokPixel(conf.tiktok_pixel_id.trim());
  }

  // Meta (Facebook / Instagram)
  if (conf.meta_enabled && conf.meta_pixel_id) {
    injectMetaPixel(conf.meta_pixel_id.trim());
  }

  // Google Analytics 4
  if (conf.ga4_enabled && conf.ga4_measurement_id) {
    injectGA4(conf.ga4_measurement_id.trim());
  }
};

// ── Unified E-Commerce Tracking Events ───────────────────────────────────────

/** 1. Page / Screen View */
export const trackPageView = (pageName: string = 'Menu'): void => {
  if (typeof window === 'undefined') return;
  try {
    const win = window as any;
    if (win.snaptr && activeConfig.snapchat_enabled) win.snaptr('track', 'PAGE_VIEW');
    if (win.ttq && activeConfig.tiktok_enabled) win.ttq.page();
    if (win.fbq && activeConfig.meta_enabled) win.fbq('track', 'PageView');
    if (win.gtag && activeConfig.ga4_enabled) {
      win.gtag('event', 'page_view', { page_title: pageName, page_location: window.location.href });
    }
  } catch (e) {}
};

/** 2. View Product / Dish Content */
export const trackViewContent = (product: { id: string; name_ar: string; price: number; category_name?: string }): void => {
  if (typeof window === 'undefined' || !product) return;
  try {
    const win = window as any;
    const price = Number(product.price || 0);

    // Snapchat: VIEW_CONTENT
    if (win.snaptr && activeConfig.snapchat_enabled) {
      win.snaptr('track', 'VIEW_CONTENT', {
        item_ids: [String(product.id)],
        item_name: product.name_ar,
        price,
        currency: 'SAR'
      });
    }

    // TikTok: ViewContent
    if (win.ttq && activeConfig.tiktok_enabled) {
      win.ttq.track('ViewContent', {
        content_id: String(product.id),
        content_name: product.name_ar,
        content_type: 'product',
        value: price,
        currency: 'SAR'
      });
    }

    // Meta: ViewContent
    if (win.fbq && activeConfig.meta_enabled) {
      win.fbq('track', 'ViewContent', {
        content_ids: [String(product.id)],
        content_name: product.name_ar,
        content_category: product.category_name,
        value: price,
        currency: 'SAR'
      });
    }

    // GA4: view_item
    if (win.gtag && activeConfig.ga4_enabled) {
      win.gtag('event', 'view_item', {
        currency: 'SAR',
        value: price,
        items: [{
          item_id: String(product.id),
          item_name: product.name_ar,
          price
        }]
      });
    }
  } catch (e) {
    console.warn('[Pixels] ViewContent tracking error:', e);
  }
};

/** 3. Add Item to Cart */
export const trackAddToCart = (product: { id: string; name_ar: string; price: number }, quantity: number = 1): void => {
  if (typeof window === 'undefined' || !product) return;
  try {
    const win = window as any;
    const unitPrice = Number(product.price || 0);
    const totalPrice = unitPrice * (quantity || 1);

    // Snapchat: ADD_CART
    if (win.snaptr && activeConfig.snapchat_enabled) {
      win.snaptr('track', 'ADD_CART', {
        item_ids: [String(product.id)],
        item_name: product.name_ar,
        number_items: quantity,
        price: totalPrice,
        currency: 'SAR'
      });
    }

    // TikTok: AddToCart
    if (win.ttq && activeConfig.tiktok_enabled) {
      win.ttq.track('AddToCart', {
        content_id: String(product.id),
        content_name: product.name_ar,
        quantity,
        value: totalPrice,
        currency: 'SAR'
      });
    }

    // Meta: AddToCart
    if (win.fbq && activeConfig.meta_enabled) {
      win.fbq('track', 'AddToCart', {
        content_ids: [String(product.id)],
        content_name: product.name_ar,
        value: totalPrice,
        currency: 'SAR'
      });
    }

    // GA4: add_to_cart
    if (win.gtag && activeConfig.ga4_enabled) {
      win.gtag('event', 'add_to_cart', {
        currency: 'SAR',
        value: totalPrice,
        items: [{
          item_id: String(product.id),
          item_name: product.name_ar,
          price: unitPrice,
          quantity
        }]
      });
    }
  } catch (e) {
    console.warn('[Pixels] AddToCart tracking error:', e);
  }
};

/** 4. Initiate Checkout / Open Drawer to order */
export const trackInitiateCheckout = (items: any[], totalAmount: number): void => {
  if (typeof window === 'undefined') return;
  try {
    const win = window as any;
    const value = Number(totalAmount || 0);
    const count = Array.isArray(items) ? items.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1;

    // Snapchat: START_CHECKOUT
    if (win.snaptr && activeConfig.snapchat_enabled) {
      win.snaptr('track', 'START_CHECKOUT', {
        number_items: count,
        price: value,
        currency: 'SAR'
      });
    }

    // TikTok: InitiateCheckout
    if (win.ttq && activeConfig.tiktok_enabled) {
      win.ttq.track('InitiateCheckout', {
        value,
        currency: 'SAR',
        contents: (items || []).map(i => ({
          content_id: String(i.productId || i.id),
          content_name: i.name_ar,
          quantity: i.quantity || 1,
          price: i.price
        }))
      });
    }

    // Meta: InitiateCheckout
    if (win.fbq && activeConfig.meta_enabled) {
      win.fbq('track', 'InitiateCheckout', {
        value,
        currency: 'SAR',
        num_items: count
      });
    }

    // GA4: begin_checkout
    if (win.gtag && activeConfig.ga4_enabled) {
      win.gtag('event', 'begin_checkout', {
        currency: 'SAR',
        value,
        items: (items || []).map(i => ({
          item_id: String(i.productId || i.id),
          item_name: i.name_ar,
          price: i.price,
          quantity: i.quantity || 1
        }))
      });
    }
  } catch (e) {
    console.warn('[Pixels] InitiateCheckout tracking error:', e);
  }
};

/** 5. Successful Purchase / Placed Order */
export const trackPurchase = (orderId: string, items: any[], totalAmount: number): void => {
  if (typeof window === 'undefined') return;
  try {
    const win = window as any;
    const value = Number(totalAmount || 0);
    const count = Array.isArray(items) ? items.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1;

    // Snapchat: PURCHASE
    if (win.snaptr && activeConfig.snapchat_enabled) {
      win.snaptr('track', 'PURCHASE', {
        transaction_id: String(orderId),
        price: value,
        currency: 'SAR',
        number_items: count
      });
    }

    // TikTok: CompletePayment
    if (win.ttq && activeConfig.tiktok_enabled) {
      win.ttq.track('CompletePayment', {
        content_type: 'product',
        value,
        currency: 'SAR'
      });
    }

    // Meta: Purchase
    if (win.fbq && activeConfig.meta_enabled) {
      win.fbq('track', 'Purchase', {
        value,
        currency: 'SAR',
        order_id: String(orderId)
      });
    }

    // GA4: purchase
    if (win.gtag && activeConfig.ga4_enabled) {
      win.gtag('event', 'purchase', {
        transaction_id: String(orderId),
        value,
        currency: 'SAR',
        items: (items || []).map(i => ({
          item_id: String(i.productId || i.id),
          item_name: i.name_ar,
          price: i.price,
          quantity: i.quantity || 1
        }))
      });
    }

    console.log('[Pixels] Purchase event tracked successfully for order:', orderId, 'Total:', value);
  } catch (e) {
    console.warn('[Pixels] Purchase tracking error:', e);
  }
};
