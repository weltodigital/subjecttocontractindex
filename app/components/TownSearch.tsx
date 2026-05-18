'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type TownOption = { slug: string; name: string; county: string | null };

export function TownSearch({ initialTowns }: { initialTowns: TownOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = query.trim()
    ? initialTowns.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : initialTowns;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function go(slug: string) {
    router.push(`/towns/${slug}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (matches.length > 0) go(matches[0].slug);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          placeholder="Search a town…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-md border border-rule bg-white px-5 py-4 text-base shadow-sm focus:border-forest focus:outline-none"
          aria-label="Search for a town"
        />
      </form>

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 z-10 mt-2 max-h-72 overflow-auto rounded-md border border-rule bg-white shadow-lg">
          {matches.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => go(t.slug)}
                className="flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left hover:bg-cream"
              >
                <span className="font-medium text-charcoal">{t.name}</span>
                {t.county && (
                  <span className="text-sm text-muted">{t.county}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div className="absolute left-0 right-0 z-10 mt-2 rounded-md border border-rule bg-white px-5 py-3 text-sm text-muted shadow-lg">
          No town found. We add more towns each month.
        </div>
      )}
    </div>
  );
}
