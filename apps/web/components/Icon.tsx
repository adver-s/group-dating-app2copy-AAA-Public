import * as HeroIcons from '@heroicons/react/24/outline'
import React from 'react'

interface IconProps {
  name: string
  className?: string
  image?: string // 画像パス
}

// アイコン名のマッピング
const iconNameMap: Record<string, keyof typeof HeroIcons> = {
  'user-circle': 'UserCircleIcon',
  'user': 'UserIcon',
  'chevron-right': 'ChevronRightIcon',
  'identification': 'IdentificationIcon',
  'megaphone': 'MegaphoneIcon',
  'document-text': 'DocumentTextIcon',
  'shield-check': 'ShieldCheckIcon',
  'chat-bubble-left-right': 'ChatBubbleLeftRightIcon',
  'heart': 'HeartIcon',
  'information-circle': 'InformationCircleIcon',
  'arrow-right-on-rectangle': 'ArrowRightOnRectangleIcon',
  'users': 'UsersIcon',
  'arrow-left-right': 'ArrowsRightLeftIcon',
  'calendar': 'CalendarIcon',
  'cog': 'CogIcon',
  // Added mappings
  'login': 'ArrowRightOnRectangleIcon',
  'chrome': 'GlobeAltIcon'
}

const Icon: React.FC<IconProps> = ({ name, className = '', image }) => {
  if (image) {
    return (
      <img src={image} alt={name} className={`w-6 h-6 rounded-full object-cover ${className}`} />
    )
  }

  // マッピングから正しいアイコン名を取得
  const iconName = iconNameMap[name] || name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Icon' as keyof typeof HeroIcons

  const IconComponent = HeroIcons[iconName]

  if (!IconComponent) {
    console.warn(`アイコン "${name}" がHeroiconsで見つかりません`)
    return null
  }

  return (
    <IconComponent
      className={`w-6 h-6 text-gray-700 hover:text-primary-500 hover:scale-105 transition-all duration-200 ${className}`}
    />
  )
}

export default Icon 