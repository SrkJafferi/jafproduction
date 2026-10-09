'use client'

import { ArrowRight, Mail } from 'lucide-react'
import { useState } from 'react'
import { siteConfig } from '@/lib/site-config'

/**
 * The footer's "Stay Updated" sign-up.
 *
 * There is no mailing-list backend behind this site, so submitting composes an
 * email to the store's general address in the visitor's own mail client rather
 * than silently dropping the address. Nothing is stored or sent anywhere else.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('')

  return (
    <form
      className="mt-5 flex flex-col gap-2.5 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        const subject = encodeURIComponent('Newsletter subscription')
        const body = encodeURIComponent(
          `Please add this address to the JAF Global Trading newsletter:\n\n${email}`,
        )
        window.location.href = `mailto:${siteConfig.contact.emails.general}?subject=${subject}&body=${body}`
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="relative flex-1">
        <Mail
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          className="h-11 w-full rounded-full border border-border bg-white pr-4 pl-10 text-[0.875rem] text-ink transition-colors duration-200 placeholder:text-muted focus:border-navy focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="btn inline-flex h-11 shrink-0 items-center justify-center gap-1.5 bg-terracotta px-4 text-[0.6875rem] font-medium tracking-[0.14em] text-white uppercase transition-colors duration-200 hover:bg-terracotta-dark"
      >
        Subscribe
        <ArrowRight className="size-3.5" aria-hidden />
      </button>
    </form>
  )
}
