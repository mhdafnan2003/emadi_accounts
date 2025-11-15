import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'SAR') {
  if (currency === 'SAR') {
    // Format specifically for SAR to match "SAR 111.00" format
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
    return `SAR ${formatted}`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat('en-US').format(number)
}

export function formatPercentage(number: number, decimals = 1) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number / 100)
}

// Helper function to format SAR currency with English numerals
export function formatSAR(amount: number) {
  return `ر.س ${formatNumber(amount)}`
}

// Helper function to format litres with English numerals
export function formatLitres(amount: number) {
  return `${formatNumber(amount)} L`
}

// Helper function specifically for dashboard stats to match "SAR 111.00" format
export function formatDashboardCurrency(amount: number) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `SAR ${formatted}`
}

// Alternative format for Arabic style "ر.س 111.00"
export function formatDashboardCurrencyArabic(amount: number) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `ر.س ${formatted}`
}