'use client'

import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'welcome' | 'recruit' | 'feedback'
}

export default function Modal({ isOpen, onClose, type }: ModalProps) {
  if (!isOpen) return null

  const renderContent = () => {
    switch (type) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Gather-s</h1>
            <h2 className="text-xl font-bold">ようこそ!</h2>
            <div className="text-left space-y-3 text-sm">
              <p>
                <span className="text-2xl">マ</span>ッチングアプリ大好きな<br />
                現役大学生が約半年かけて
              </p>
              <p>
                マッチングアプリ使いたいけど<br />
                一人で使うのは怖いよ~<br />
                という思いから、
              </p>
              <p>
                合コンや2対2や3対3で出会える<br />
                アプリがあればいいのに!!
              </p>
              <p>
                ...と個人的な欲望からスタートしました<br />
                Gather-sですが、いろんな方の協力も<br />
                あってなんとか正式リリースまで<br />
                漕ぎ着けました..!
              </p>
              <p>
                手作り感満載のアプリなのでエラー<br />
                とか起きちゃうかもだけど、<br />
                真心込めて作ったマッチングアプリなので<br />
                優しく扱ってね!
              </p>
            </div>
            <p className="text-sm font-bold">adver-s</p>
          </div>
        )
      
      case 'recruit':
        return (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-bold">一緒にadver-sを創ってくれる方を募集!!</h1>
            <p className="text-sm font-bold">
              現役大学生のみで作られた<br />
              たった4人の平均年齢21歳のチームです
            </p>
            <div className="text-sm space-y-2">
              <p>大学生の方</p>
              <p>社会人の方</p>
              <p>投資方の方</p>
              <p>adver-sを応援してくれる方</p>
            </div>
            <p className="text-sm">どんな方でも お気軽に絡んできてください!</p>
            <div className="text-xs space-y-2">
              <div>
                <p className="font-bold">adver-sホームページ</p>
                <p>https://sites.google.com/view/adver-s/adver-sについて</p>
              </div>
              <div>
                <p className="font-bold">adver-s公式SNS</p>
                <p>X; @advers1gather</p>
              </div>
            </div>
          </div>
        )
      
      case 'feedback':
        return (
          <div className="text-center space-y-4">
                      <div className="flex justify-between items-start">
            <h1 className="text-lg font-bold">Gather-sを使ってくれてありがとう!</h1>
            <div className="writing-mode-vertical text-sm">
              <p>みんなの意見を教えて!</p>
            </div>
          </div>
            <div className="text-left space-y-3 text-sm">
              <p>
                現役大学生で頑張って作ったアプリなので多分色々がばいです..
              </p>
              <p>
                どうかエラーや意見あったら遠慮なくください!!
              </p>
              <p>
                応援コメも待ってます!
              </p>
              <p>
                ※アンチコメは泣いちゃう
              </p>
            </div>
            <p className="text-sm font-bold">adver-s</p>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-black">
        {renderContent()}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
