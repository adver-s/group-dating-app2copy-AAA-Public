export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import GroupMeetingClient from './GroupMeetingClient'

export default function GroupMeetingPage() {
    return (
        <Suspense fallback={null}>
            <GroupMeetingClient />
        </Suspense>
    )
}


