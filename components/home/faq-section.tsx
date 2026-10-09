import Image from 'next/image'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/home/section-heading'
import { faqs } from '@/lib/content/site-content'
import { faqJsonLd } from '@/lib/seo/json-ld'

/**
 * FAQs as the live page lays them out: the accordion on the left, a tall brand
 * visual on the right. The visual is a genuine JAF photograph — a kraft paper
 * bag carrying the JAF Global Trading logo. Accordion is native `<details>`:
 * keyboard accessible and fully functional without JavaScript, with the first
 * answer expanded on load so the section never reads as an empty list. The same
 * six answers feed the FAQPage structured data.
 */
export function FaqSection() {
  return (
    <section className="container-page py-12 lg:py-16" id="faqs">
      <SectionHeading
        eyebrow="Good to know"
        title="JAF Global Trading FAQs"
        align="left"
        swoosh
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 text-left text-[0.9375rem] font-medium text-navy transition-colors duration-200 hover:text-terracotta">
                {faq.question}
                <Plus
                  className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">{faq.answer}</p>
            </details>
          ))}
        </div>

        <figure className="relative hidden aspect-4/5 overflow-hidden bg-cream lg:block">
          <Image
            src="https://cdn.jsdelivr.net/gh/SrkJaffri/jaftradings@main/columnsplitimage.avif"
            alt="A hand holding a kraft paper shopping bag printed with the JAF Global Trading logo"
            fill
            sizes="(min-width: 1024px) 40vw, 0px"
            className="object-cover"
          />
        </figure>
      </div>

      <script
        type="application/ld+json"
        // Static FAQ structured data built from the audited answers.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
    </section>
  )
}
