'use client';

import { useState } from 'react';

type FormState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'email_sent' }
  | { kind: 'not_subscribed' }
  | { kind: 'no_referrals'; referralCount: number }
  | { kind: 'error'; message: string };

export function RequestAccessForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>({ kind: 'idle' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as {
        status?: 'email_sent' | 'not_subscribed' | 'no_referrals';
        referral_count?: number;
        error?: string;
      };

      if (json.status === 'email_sent') {
        setState({ kind: 'email_sent' });
      } else if (json.status === 'not_subscribed') {
        setState({ kind: 'not_subscribed' });
      } else if (json.status === 'no_referrals') {
        setState({
          kind: 'no_referrals',
          referralCount: json.referral_count ?? 0,
        });
      } else {
        setState({
          kind: 'error',
          message: json.error ?? 'Something went wrong. Please try again.',
        });
      }
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  if (state.kind === 'email_sent') {
    return (
      <div className="rounded-lg border border-forest/20 bg-forest/5 p-6">
        <h2 className="font-serif text-xl text-forest">
          Check your email
        </h2>
        <p className="mt-2 text-charcoal-soft">
          We&apos;ve sent a magic link to <strong>{email}</strong>. It expires
          in 15 minutes.
        </p>
      </div>
    );
  }

  if (state.kind === 'not_subscribed') {
    return (
      <div className="rounded-lg border border-rule bg-white p-6">
        <h2 className="font-serif text-xl text-forest">
          You&apos;re not subscribed yet
        </h2>
        <p className="mt-2 text-charcoal-soft">
          Access is for Subject To Contract subscribers. The newsletter is
          free.
        </p>
        <a
          href="https://subjecttocontract.com"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
        >
          Subscribe at subjecttocontract.com
        </a>
      </div>
    );
  }

  if (state.kind === 'no_referrals') {
    return (
      <div className="rounded-lg border border-rule bg-white p-6">
        <h2 className="font-serif text-xl text-forest">You&apos;re so close</h2>
        <p className="mt-2 text-charcoal-soft">
          Refer just 1 colleague to Subject To Contract to unlock the Index.
          You currently have {state.referralCount} referral
          {state.referralCount === 1 ? '' : 's'}. Your share link comes
          with every weekly newsletter.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-charcoal-soft">
        Email address
      </label>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-rule bg-white px-4 py-3 text-base focus:border-forest focus:outline-none"
        placeholder="you@agency.com"
      />
      <button
        type="submit"
        disabled={state.kind === 'loading' || !email}
        className="mt-2 inline-flex items-center justify-center rounded-md bg-forest px-6 py-3 font-medium text-cream transition hover:bg-forest-soft disabled:opacity-60"
      >
        {state.kind === 'loading' ? 'Sending…' : 'Send magic link'}
      </button>
      {state.kind === 'error' && (
        <p className="text-sm text-muted-red">{state.message}</p>
      )}
    </form>
  );
}
