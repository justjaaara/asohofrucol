import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-gold-500 text-ink-950 hover:bg-gold-400 focus-visible:ring-gold-600 shadow-sm',
  secondary:
    'border border-forest-800/30 bg-white text-forest-900 hover:bg-forest-50 focus-visible:ring-forest-700',
  ghost: 'text-ink-600 hover:bg-cream-200 focus-visible:ring-ink-400',
  danger: 'text-danger-600 hover:bg-danger-50 focus-visible:ring-danger-500',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}
