export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import ConfirmPageClient from './ConfirmPageClient'

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageClient />
    </Suspense>
  )
}