export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import PrivacyClient from './PrivacyClient'

export default function PrivacyPage() {
  return (
    <Suspense fallback={null}>
      <PrivacyClient />
    </Suspense>
  )
}
