'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Icon from '../../../components/Icon'

export default function PrivacyClient() {
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">プライバシーポリシー</h1>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white px-4 py-6">
                <div className="max-w-4xl mx-auto prose prose-sm">
                    <p className="text-gray-700 mb-6">
                        Gather-s（以下「当サービス」といいます。）は、ユーザーの個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
                    </p>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第1条（収集する情報）</h2>
                    <p className="text-gray-700 mb-3">
                        当サービスは、ユーザー登録や利用に際して以下の情報を収集することがあります。
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
                        <li>氏名、ニックネーム、プロフィール情報</li>
                        <li>電話番号、メールアドレス</li>
                        <li>年齢確認書類に含まれる情報</li>
                        <li>位置情報、端末情報、IPアドレス</li>
                        <li>利用履歴（ログイン日時、投稿、マッチング履歴など）</li>
                    </ul>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第2条（利用目的）</h2>
                    <p className="text-gray-700 mb-3">
                        当サービスは、収集した情報を以下の目的で利用します。
                    </p>
                    <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">
                        <li>本サービスの提供・運営のため</li>
                        <li>本人確認、年齢確認のため</li>
                        <li>不正行為や違反行為の防止・対応のため</li>
                        <li>サービス改善、新機能開発のため</li>
                        <li>お知らせや問い合わせ対応のため</li>
                    </ol>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第3条（第三者提供）</h2>
                    <p className="text-gray-700 mb-6">
                        法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
                    </p>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第4条（安全管理）</h2>
                    <p className="text-gray-700 mb-6">
                        当サービスは、収集した個人情報が不正にアクセスされないよう、適切なセキュリティ対策を講じます。
                    </p>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第5条（事故発生時の対応）</h2>
                    <p className="text-gray-700 mb-6">
                        当サービスは、個人情報の漏洩、紛失、毀損等の事故が発生した場合、速やかに事実関係を調査し、影響を受ける可能性のあるユーザーに通知するとともに、再発防止策を講じます。
                    </p>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第6条（ユーザーの権利）</h2>
                    <p className="text-gray-700 mb-6">
                        ユーザーは、自身の個人情報について開示・訂正・削除を求めることができます。
                    </p>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">第7条（改定）</h2>
                    <p className="text-gray-700 mb-6">
                        本ポリシーの内容は、必要に応じて改定することがあります。
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-md font-bold text-gray-800 mb-3">【お問い合わせ先】</h3>
                        <div className="text-gray-700 space-y-1">
                            <p><span className="font-medium">運営者名（団体名）：</span>adver-s</p>
                            <p><span className="font-medium">メールアドレス：</span>advers.gather@gmail.com</p>
                            <p><span className="font-medium">所在地：</span>東京都または神奈川県（活動拠点に準ずる）</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


