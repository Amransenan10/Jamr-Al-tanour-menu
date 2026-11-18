import React, { useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdTrackingConfig {
  source: string;
  campaign: string;
}

const SHORTLINK_MAP: Record<string, AdTrackingConfig> = {
  t: { source: 'tiktok', campaign: 'ad1' },
  tiktok: { source: 'tiktok', campaign: 'ad1' },
  s: { source: 'snapchat', campaign: 'ad1' },
  snap: { source: 'snapchat', campaign: 'ad1' },
  snapchat: { source: 'snapchat', campaign: 'ad1' },
  i: { source: 'instagram', campaign: 'bio' },
  ig: { source: 'instagram', campaign: 'bio' },
  instagram: { source: 'instagram', campaign: 'bio' },
  g: { source: 'google_maps', campaign: 'maps' },
  maps: { source: 'google_maps', campaign: 'maps' },
  w: { source: 'whatsapp', campaign: 'chat' },
  wa: { source: 'whatsapp', campaign: 'chat' },
};

export const AdTrackingRedirect: React.FC<{ channelKey?: string }> = ({ channelKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const rawKey = (
    channelKey ||
    location.pathname.replace(/^\/+/, '').split('/')[0] ||
    ''
  ).toLowerCase().trim();

  const config = SHORTLINK_MAP[rawKey] || { source: rawKey, campaign: 'shortcut' };

  useLayoutEffect(() => {
    try {
      // 1. Record traffic attribution silently in localStorage
      const attribution = {
        source: config.source,
        medium: 'cpc',
        campaign: config.campaign,
        referrer: document.referrer || '',
        landingPage: location.pathname,
        firstVisitAt: new Date().toISOString(),
        lastVisitAt: new Date().toISOString()
      };
      localStorage.setItem('jamr_traffic_attribution', JSON.stringify(attribution));
    } catch (e) {
      console.warn('Could not store traffic attribution:', e);
    }

    // 2. Redirect immediately to the home menu without any intermediate flash or delay
    navigate('/', { replace: true });
  }, [config, navigate, location.pathname]);

  // Return nothing so no loading screen or icon flashes on screen
  return null;
};
