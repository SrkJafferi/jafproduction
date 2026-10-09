'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Lock, Mail, MessageSquare, UserRound } from 'lucide-react'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import { siteConfig } from '@/lib/site-config'
import { whatsAppUrl } from '@/lib/whatsapp'

/** Shared field shell: room for the leading glyph, room to breathe. */
const FIELD =
  'w-full rounded-xl border border-border bg-surface-muted py-3 pr-3.5 pl-10 text-sm text-ink transition-colors duration-200 placeholder:text-muted/80 focus:border-border-strong focus:outline-none'

/**
 * "Drop Us A Line" without a backend: the message is composed in the browser and
 * handed to WhatsApp (or the visitor's mail client). Nothing is posted anywhere,
 * so no enquiry can be silently lost in a form nobody reads.
 *
 * Every field is optional — the message falls back to "I would like to ask about
 * your products." — so no field is badged as required.
 */
export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const composed = useMemo(
    () =>
      [
        `Hello ${siteConfig.name},`,
        '',
        ...(name ? [`Name: ${name}`] : []),
        ...(email ? [`Email: ${email}`] : []),
        '',
        message || 'I would like to ask about your products.',
      ].join('\n'),
    [email, message, name],
  )

  const mailto = `mailto:${siteConfig.contact.emails.general}?subject=${encodeURIComponent(
    'Website enquiry',
  )}&body=${encodeURIComponent(composed)}`

  return (
    <form
      className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-7"
      onSubmit={(event) => {
        event.preventDefault()
        window.open(whatsAppUrl(composed), '_blank', 'noopener,noreferrer')
      }}
    >
      <p className="eyebrow">Drop us a line</p>
      <h2 className="mt-2 text-2xl font-semibold text-navy">Tell us what you need</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        We will reply as soon as possible. Your message opens in WhatsApp so you can see exactly what is being sent.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium text-navy">
            Name
          </label>
          <div className="relative mt-2">
            <UserRound
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="contact-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Your name"
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className="text-sm font-medium text-navy">
            Email
          </label>
          <div className="relative mt-2">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="contact-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="your@email.com"
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="text-sm font-medium text-navy">
            Message
          </label>
          <div className="relative mt-2">
            <MessageSquare className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" aria-hidden />
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what you need…"
              className={FIELD}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="btn inline-flex flex-1 items-center justify-center gap-2 bg-terracotta px-5 py-3.5 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-terracotta-dark"
        >
          <WhatsAppGlyph className="size-4" />
          Send on WhatsApp
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <a
          href={mailto}
          className="btn inline-flex flex-1 items-center justify-center gap-2 border border-navy/25 bg-white px-5 py-3.5 text-sm font-medium tracking-wide text-navy transition-colors duration-200 hover:border-navy"
        >
          <Mail className="size-4" aria-hidden />
          Email instead
        </a>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        Your information is safe with us. We typically reply within a few hours.
      </p>
    </form>
  )
}
