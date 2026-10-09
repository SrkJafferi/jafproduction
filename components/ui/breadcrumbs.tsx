import Link from 'next/link'

export type Crumb = {
  label: string
  href?: string
}

/** Semantic breadcrumb trail; the last crumb is the current page. */
export function Breadcrumbs({ trail, tone = 'default' }: { trail: Crumb[]; tone?: 'default' | 'onDark' }) {
  const muted = tone === 'onDark' ? 'text-cream/65' : 'text-muted'
  const current = tone === 'onDark' ? 'text-cream' : 'text-navy'
  const link = tone === 'onDark' ? 'hover:text-cream' : 'hover:text-navy'

  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${muted}`}>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className={`${link} transition-colors duration-200`}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? current : undefined} aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
