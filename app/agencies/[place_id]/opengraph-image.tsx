import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default function AgencyOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAF7F2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            background: '#1B4332',
            padding: '56px 140px',
            borderRadius: 32,
            display: 'flex',
          }}
        >
          <span
            style={{
              color: '#FAF7F2',
              fontSize: 220,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            STC
          </span>
        </div>
        <div
          style={{
            marginTop: 56,
            color: '#1B4332',
            fontSize: 38,
            letterSpacing: 16,
          }}
        >
          SUBJECT TO CONTRACT
        </div>
        <div
          style={{
            marginTop: 32,
            color: '#6B6B6B',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          UK Estate Agent Index
        </div>
      </div>
    ),
    { ...size },
  );
}
