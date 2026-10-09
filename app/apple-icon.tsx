import { ImageResponse } from 'next/og';

// Home-screen icon for iOS "Add to Home Screen". Apple ignores SVG; 180×180 PNG.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0706',
          color: '#ff5a1f',
          fontSize: 118,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}