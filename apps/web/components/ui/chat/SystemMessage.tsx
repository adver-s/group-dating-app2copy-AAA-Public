import React from 'react'

interface SystemMessageProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

const SystemMessage: React.FC<SystemMessageProps> = ({ 
  message, 
  type = 'info' 
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="flex justify-center my-4">
      <div className={`px-4 py-2 rounded-full border text-sm font-medium ${getTypeStyles()}`}>
        {message}
      </div>
    </div>
  )
}

export default SystemMessage
