import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'next-env.d.ts',
      // One-time audit + migration inputs: not part of the application.
      'reference/**',
      '.audit/**',
      'public/**',
      'data/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
]

export default config
