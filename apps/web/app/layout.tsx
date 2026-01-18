import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ActiveTeamProvider } from '../contexts/ActiveTeamContext'

export const metadata: Metadata = {
  title: 'Group Dating App',
  description: 'A group-matching dating app for creating meaningful connections',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="font-sans">
        <AuthProvider>
          <ActiveTeamProvider>
            <div className="min-h-screen">
              {children}
            </div>
          </ActiveTeamProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 