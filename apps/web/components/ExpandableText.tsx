'use client'

import React, { useState } from 'react'

interface ExpandableTextProps {
  text: string
  maxLength: number
  className?: string
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (text.length <= maxLength) {
    return (
      <p className={`text-gray-700 leading-relaxed ${className}`}>
        {text}
      </p>
    )
  }

  return (
    <div className={className}>
      <p className="text-gray-700 leading-relaxed">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
      >
        {isExpanded ? '閉じる' : '全文を見る'}
      </button>
    </div>
  )
}

export default ExpandableText
