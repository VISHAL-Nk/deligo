import SearchPage from '@/components/Search'
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Products - Deligo',
  description: 'Search for products across all categories. Find electronics, fashion, books, and more at great prices.',
  openGraph: {
    title: 'Search Products - Deligo',
    description: 'Search for products across all categories',
  }
}

export default function Page() {
  return (
    <SearchPage />
  )
}
