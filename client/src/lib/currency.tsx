import React from 'react';

/**
 * Currency formatting utilities for Saudi Riyal (SAR)
 * Uses a custom image symbol for the currency
 */

/**
 * Format a number as Saudi Riyal currency
 * @param amount - The amount to format (number or string)
 * @param options - Formatting options
 * @returns Formatted currency element
 */
export function formatSAR(
  amount: number | string | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: 'ar' | 'en';
    useSymbol?: boolean;
  } = {}
): React.ReactNode {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'en',
    useSymbol = true, // Default to true to show the logo
  } = options;

  // Handle null/undefined/empty
  if (amount === null || amount === undefined || amount === '') {
    return locale === 'ar' ? 'غير محدد' : 'Not specified';
  }

  // Parse amount
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) {
    return locale === 'ar' ? 'غير محدد' : 'Not specified';
  }

  // Format number with locale-specific number formatting
  // User requested English numbers (0-9) even for Arabic locale
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);

  // Add currency symbol/abbreviation
  if (useSymbol) {
    return (
      <span className="inline-flex items-center gap-1 align-baseline whitespace-nowrap">
        <span>{formattedNumber}</span>
        <img
          src="/riyal-symbol.png"
          alt="SAR"
          className="h-3.5 w-auto object-contain dark:invert select-none pointer-events-none"
          style={{ marginTop: '1px' }}
        />
      </span>
    );
  } else {
    // Fallback to text if useSymbol is strictly false
    return locale === 'ar'
      ? `${formattedNumber} ر.س`
      : `${formattedNumber} SAR`;
  }
}

/**
 * Format currency for display in cards/components
 * Uses the image symbol
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: 'ar' | 'en';
  } = {}
): React.ReactNode {
  return formatSAR(amount, {
    ...options,
    useSymbol: true,
  });
}

/**
 * Get just the currency symbol/abbreviation
 * Note: If you need the image, use the component directly or formatCurrency
 */
export function getCurrencySymbol(locale: 'ar' | 'en' = 'en', useSymbol = true): string {
  // Return text fallback as this function is expected to return string
  return locale === 'ar' ? 'ر.س' : 'SAR';
}
