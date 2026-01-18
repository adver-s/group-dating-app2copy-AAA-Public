export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import ConfirmedMeetingsClient from './ConfirmedMeetingsClient'

export default function ConfirmedMeetingsPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmedMeetingsClient />
    </Suspense>
  )
}