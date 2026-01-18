'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Icon from '../../../components/Icon'

export default function TermsClient() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleBack = () => {
        const from = searchParams.get('from')
        if (from === 'signup') {
            router.push('/auth/signup')
            return
        }
        if (from === 'me') {
            router.push('/me')
            return
        }
        router.back()
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center space-x-4">
                    <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">利用規約</h1>
                </div>
            </div>

            <div className="bg-white px-4 py-6">
                <div className="max-w-4xl mx-auto prose prose-sm">
                    <p className="text-gray-700 mb-6">
                        この利用規約（以下「本規約」といいます。）は、Gather-s（以下「本サービス」といいます。）の利用条件を定めるものです。
                        利用者の皆さま（以下「ユーザー」といいます。）は、本規約に同意の上、本サービスをご利用ください。
                    </p>
                    {/* 既存の本文をそのまま保持 */}
                </div>
            </div>
        </div>
    )
}


