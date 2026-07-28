import { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-cream-200 bg-white shadow-[0_1px_2px_rgba(23,20,16,0.04),0_8px_24px_-16px_rgba(23,20,16,0.15)] ${className}`}
      {...props}
    />
  )
}
