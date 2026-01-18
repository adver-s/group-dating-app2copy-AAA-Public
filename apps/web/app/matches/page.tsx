export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import MatchesClient from './MatchesClient'

export default function MatchesPage() {
    return (
        <Suspense fallback={null}>
            <MatchesClient />
        </Suspense>
    )
}


