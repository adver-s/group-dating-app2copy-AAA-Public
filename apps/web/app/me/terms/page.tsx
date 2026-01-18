export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import TermsClient from './TermsClient'

export default function TermsPage() {
    return (
        <Suspense fallback={null}>
            <TermsClient />
        </Suspense>
    )
}


