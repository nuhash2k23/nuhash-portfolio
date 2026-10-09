'use client';
import { audio } from '@/lib/audio';
import { ui, useStore } from '@/lib/state';

export default function SoundToggle() {
  const on = useStore(ui, (s) => s.soundOn);
  return (
    <button
      className={`sound ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      onClick={async () => {
        if (on) {
          audio.disable();
          ui.set({ soundOn: false });
        } else {
          await audio.enable();
          ui.set({ soundOn: true });
        }
      }}
      data-cursor
    >
      <span className="sound__bars" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound__label">Sound {on ? 'on' : 'off'}</span>
    </button>
  );
}
