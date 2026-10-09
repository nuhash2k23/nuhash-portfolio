'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { hero } from '@/lib/content';
import { getLenis } from '@/lib/scroll';
import { audio } from '@/lib/audio';

/**
 * Hero tile (where the portrait was): a muted looping showreel.
 * Click → the video grows out of the tile to full screen.
 */
export default function HeroVideo() {
  const tile = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !panel.current || !tile.current) return;
    const r = tile.current.getBoundingClientRect();
    const target = panel.current.querySelector<HTMLElement>('.vmodal__frame')!;
    const t = target.getBoundingClientRect();
    gsap.fromTo(
      target,
      {
        x: r.left + r.width / 2 - (t.left + t.width / 2),
        y: r.top + r.height / 2 - (t.top + t.height / 2),
        scaleX: r.width / t.width,
        scaleY: r.height / t.height,
      },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.1, ease: 'expo.inOut' },
    );
    gsap.fromTo(panel.current.querySelector('.vmodal__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.8 });
    getLenis()?.stop();
    audio.whoosh(0.9);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    if (!panel.current) return setOpen(false);
    audio.whoosh(0.6);
    gsap.to(panel.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        setOpen(false);
        getLenis()?.start();
      },
    });
  }

  return (
    <>
      <button
        ref={tile}
        className="hero__video hero__enter"
        onClick={() => setOpen(true)}
        aria-label={`${hero.videoLabel} — play showreel`}
        data-cursor
        data-liquid
      >
        {hero.video ? (
          <video src={hero.video} poster={hero.videoPoster || undefined} muted loop playsInline preload="metadata" />
        ) : (
          <div className="placeholder placeholder--video">
            <span>Showreel</span>
          </div>
        )}
        {/* red tint over the tile video */}
        <span className="hero__video-tint" aria-hidden />
        <span className="hero__video-play" aria-hidden>
          ▶
        </span>
        <span className="hero__video-label">{hero.videoLabel}</span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div ref={panel} className="vmodal" role="dialog" aria-modal="true" aria-label="Showreel">
            <div className="vmodal__backdrop" onClick={close} />
            <div className="vmodal__frame">
              {hero.video ? (
                <video src={hero.video} poster={hero.videoPoster || undefined} controls autoPlay playsInline />
              ) : (
                <div className="placeholder placeholder--video">
                  <span>Showreel placeholder — add /video/showreel.mp4</span>
                </div>
              )}
            </div>
            <button className="vmodal__close disperse" onClick={close} data-cursor>
              Close ×
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}