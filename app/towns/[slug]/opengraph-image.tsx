import { ImageResponse } from 'next/og';
import { getTownRanking } from '@/lib/queries';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function TownOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const ranking = await getTownRanking(params.slug);
  const top = (ranking?.sales ?? []).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#FAF7F2',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'system-ui',
              fontSize: 22,
              letterSpacing: 2,
              color: '#6B6B6B',
              textTransform: 'uppercase',
            }}
          >
            UK Estate Agent Index
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 72,
              fontWeight: 500,
              color: '#1B4332',
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            Best estate agents in {ranking?.town.name ?? 'the UK'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {top.length > 0
            ? top.map((row, idx) => (
                <div
                  key={row.agencyId}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 20,
                    fontFamily: 'system-ui',
                    fontSize: 32,
                    color: '#1A1A1A',
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      color: '#6B6B6B',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontWeight: 500 }}>{row.name}</span>
                  <span style={{ marginLeft: 'auto', color: '#1B4332' }}>
                    {row.compositeScore.toFixed(1)}
                  </span>
                </div>
              ))
            : null}
          <div
            style={{
              fontFamily: 'system-ui',
              fontSize: 20,
              color: '#6B6B6B',
              marginTop: 12,
            }}
          >
            Subject To Contract · index.subjecttocontract.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
