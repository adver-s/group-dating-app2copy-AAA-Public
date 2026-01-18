export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import TeamMeetingClient from './TeamMeetingClient'

export default function TeamMeetingPage() {
    return (
        <Suspense fallback={null}>
            <TeamMeetingClient />
        </Suspense>
    )
}


