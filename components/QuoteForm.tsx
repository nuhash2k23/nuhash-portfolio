'use client';
import { useMemo, useState } from 'react';
import { quote, site } from '@/lib/content';

type Mode = 'standard' | 'engagement';

/**
 * Quote questionnaire. Two modes the visitor toggles:
 *  - Quick note  → name, email, project type, message
 *  - Full brief  → + company, budget, timeline, engagement type, referral
 * Submits by building a pre-filled mailto to site.email (no backend yet).
 */
export default function QuoteForm() {
  const [mode, setMode] = useState<Mode>('standard');
  const [f, setF] = useState({
    name: '',
    email: '',
    company: '',
    type: quote.projectTypes[0],
    engagement: quote.engagementTypes[0],
    budget: quote.budgets[0],
    timeline: quote.timelines[0],
    referral: quote.referrals[0],
    message: '',
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const mailHref = useMemo(() => {
    const L: string[] = [];
    L.push(`Name: ${f.name || '—'}`);
    L.push(`Email: ${f.email || '—'}`);
    if (mode === 'engagement') {
      L.push(`Company: ${f.company || '—'}`);
    }
    L.push(`Project type: ${f.type}`);
    if (mode === 'engagement') {
      L.push(`Engagement: ${f.engagement}`);
      L.push(`Budget: ${f.budget}`);
      L.push(`Timeline: ${f.timeline}`);
      L.push(`Found via: ${f.referral}`);
    }
    L.push('', 'Details:', f.message || '—');
    const subject = `Project enquiry — ${f.type}${f.name ? ` (${f.name})` : ''}`;
    return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(L.join('\n'))}`;
  }, [f, mode]);

  const canSend = f.name.trim() && /\S+@\S+\.\S+/.test(f.email) && f.message.trim();

  return (
    <form
      className="quote"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) window.location.href = mailHref;
      }}
    >
      {/* mode toggle */}
      <div className="quote__modes" role="tablist" aria-label="How much detail">
        {quote.modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`quote__mode ${mode === m.id ? 'is-active' : ''}`}
            onClick={() => setMode(m.id)}
            data-cursor
          >
            <span>{m.label}</span>
            <em>{m.note}</em>
          </button>
        ))}
      </div>

      <div className="quote__grid">
        <label className="quote__field">
          <span>Name</span>
          <input value={f.name} onChange={set('name')} placeholder="Your name" required />
        </label>
        <label className="quote__field">
          <span>Email</span>
          <input type="email" value={f.email} onChange={set('email')} placeholder="you@company.com" required />
        </label>

        {mode === 'engagement' && (
          <label className="quote__field">
            <span>Company <i>(optional)</i></span>
            <input value={f.company} onChange={set('company')} placeholder="Company or agency" />
          </label>
        )}

        <label className="quote__field">
          <span>Project type</span>
          <select value={f.type} onChange={set('type')}>
            {quote.projectTypes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>

        {mode === 'engagement' && (
          <>
            <label className="quote__field">
              <span>Engagement</span>
              <select value={f.engagement} onChange={set('engagement')}>
                {quote.engagementTypes.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="quote__field">
              <span>Budget</span>
              <select value={f.budget} onChange={set('budget')}>
                {quote.budgets.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="quote__field">
              <span>Timeline</span>
              <select value={f.timeline} onChange={set('timeline')}>
                {quote.timelines.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="quote__field">
              <span>How did you find me?</span>
              <select value={f.referral} onChange={set('referral')}>
                {quote.referrals.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <label className="quote__field quote__field--wide">
          <span>Details</span>
          <textarea
            value={f.message}
            onChange={set('message')}
            rows={mode === 'engagement' ? 6 : 4}
            placeholder="A rough idea or a full spec — either works. What are you building, and what does done look like?"
            required
          />
        </label>
      </div>

      <div className="quote__foot">
        <button type="submit" className="btn btn--red disperse" disabled={!canSend} data-cursor>
          Send enquiry →
        </button>
        <p className="quote__note">
          Opens your mail app, pre-filled. Prefer direct?{' '}
          <a href={`mailto:${site.email}`} data-cursor>
            {site.email}
          </a>
        </p>
      </div>
    </form>
  );
}
