'use client';
import { useEffect, useState } from 'react';
import { site } from '@/lib/content';

/** Dhaka coords for the weather lookup. */
const LAT = 23.81;
const LON = 90.41;

/**
 * Top strip: location · live weather · local time.
 * Weather comes from Open-Meteo (no API key); if it fails we just show place + time.
 */
export default function LocalStrip() {
  const [time, setTime] = useState('');
  const [temp, setTemp] = useState<number | null>(null);

  // live clock in the site's timezone
  useEffect(() => {
    const fmt = () =>
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: site.timezone,
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      );
    fmt();
    const iv = window.setInterval(fmt, 15000);
    return () => window.clearInterval(iv);
  }, []);

  // current temperature, refreshed every 15 min
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m`,
          { cache: 'no-store' },
        );
        const j = await r.json();
        const t = j?.current?.temperature_2m;
        if (alive && typeof t === 'number') setTemp(Math.round(t));
      } catch {
        /* no weather — strip still shows place + time */
      }
    };
    load();
    const iv = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(iv);
    };
  }, []);

  return (
    <p className="localstrip" aria-label="Location, weather and local time">
      <span className="localstrip__place">
        {site.city}, {site.country}
      </span>
      {temp !== null && (
        <>
          <span className="localstrip__dot" aria-hidden>·</span>
          <span className="localstrip__temp">{temp}°C</span>
        </>
      )}
      <span className="localstrip__dot" aria-hidden>·</span>
      <span className="localstrip__time">{time}</span>
    </p>
  );
}
