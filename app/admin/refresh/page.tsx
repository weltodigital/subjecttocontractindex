'use client';

import { useState } from 'react';

type RefreshResponse = {
  startedAt?: string;
  finishedAt?: string;
  snapshotDate?: string;
  townsAttempted?: number;
  townsSucceeded?: number;
  townsFailed?: number;
  townsSkipped?: number;
  perTown?: Array<{
    slug: string;
    status: 'ok' | 'error' | 'skipped';
    agenciesProcessed: number;
    agenciesFailed: number;
    error?: string;
  }>;
  error?: string;
};

export default function AdminRefreshPage() {
  const [password, setPassword] = useState('');
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RefreshResponse | null>(null);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password, force }),
      });
      const json = (await res.json()) as RefreshResponse;
      setResult(json);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <h1 className="font-serif text-3xl">Manual refresh</h1>
      <p className="mt-4 text-charcoal-soft">
        Triggers the same job as the monthly cron. By default, towns that
        already have a snapshot for the current month are skipped so you
        don&apos;t re-bill Google. Tick &ldquo;force&rdquo; only if you need
        to deliberately re-run an already-completed month.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <label className="text-sm font-medium text-charcoal-soft">
          Admin password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-rule bg-white px-4 py-3 font-mono text-sm focus:border-forest focus:outline-none"
          placeholder="ADMIN_PASSWORD"
        />
        <label className="mt-2 flex items-center gap-2 text-sm text-charcoal-soft">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="h-4 w-4 rounded border-rule"
          />
          Force re-run (re-bills Google API for towns already done this month)
        </label>
        <button
          type="button"
          onClick={handleRun}
          disabled={loading || !password}
          className="mt-2 rounded-md bg-forest px-6 py-3 font-medium text-cream transition hover:bg-forest-soft disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run refresh'}
        </button>
      </div>

      {result && (
        <pre className="mt-8 overflow-auto rounded-md border border-rule bg-white p-4 font-mono text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
