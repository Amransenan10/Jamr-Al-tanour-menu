import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, Plugin } from 'vite';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractSeoFromAppSettings(row: { announcement_text?: string; popular_subtitle?: string } | null): {
  h1: string;
  description: string;
} {
  if (!row) return { h1: '', description: '' };

  const candidateFields = [row.announcement_text, row.popular_subtitle];
  for (const field of candidateFields) {
    if (typeof field === 'string' && field.includes('[CONFIG:')) {
      const startIdx = field.indexOf('[CONFIG:') + 8;
      const endIdx = field.lastIndexOf(']');
      if (startIdx > 8 && endIdx > startIdx) {
        try {
          const parsed = JSON.parse(field.substring(startIdx, endIdx));
          const seo = parsed?.seo_settings;
          if (seo && typeof seo === 'object') {
            return {
              h1: typeof seo.restaurant_name === 'string' ? seo.restaurant_name.trim() : '',
              description: typeof seo.meta_description === 'string' ? seo.meta_description.trim() : '',
            };
          }
        } catch {
          // Ignore malformed config tag
        }
      }
    }
  }

  return { h1: '', description: '' };
}

function seoInitialHtmlPlugin(supabaseUrl: string, supabaseAnonKey: string): Plugin {
  return {
    name: 'seo-initial-html',
    async transformIndexHtml(html) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return html;
      }

      try {
        const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/app_settings?id=eq.1&select=announcement_text,popular_subtitle`;
        const response = await fetch(endpoint, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        });

        if (!response.ok) {
          return html;
        }

        const rows = (await response.json()) as Array<{ announcement_text?: string; popular_subtitle?: string }>;
        const { h1, description } = extractSeoFromAppSettings(rows?.[0] || null);

        if (!h1 && !description) {
          return html;
        }

        const h1Html = h1 ? `<h1>${escapeHtml(h1)}</h1>` : '';
        const descHtml = description ? `<p>${escapeHtml(description)}</p>` : '';
        const seoBlock = `<section id="seo-intro" aria-label="تعريف المطعم" style="max-width:56rem;margin:1rem auto 0;padding:0 1rem;text-align:right">${h1Html}${descHtml}</section>`;

        return html.replace('<div id="root"></div>', `<div id="root">${seoBlock}</div>`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    plugins: [react(), tailwindcss(), seoInitialHtmlPlugin(supabaseUrl, supabaseAnonKey)],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'motion': ['motion'],
            'supabase': ['@supabase/supabase-js'],
            'icons': ['lucide-react'],
          }
        }
      }
    }
  };
});
