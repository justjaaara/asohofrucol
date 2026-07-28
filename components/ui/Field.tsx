import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const controlClass =
  'mt-1.5 w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm text-ink-950 shadow-sm transition-colors placeholder:text-ink-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20 disabled:bg-cream-100 disabled:text-ink-400'

export function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-ink-600">
        {label}
        {required && <span className="ml-0.5 text-terracotta-600">*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClass} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} ${className}`} {...props} />
}

export function CheckboxLabel({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`flex items-center gap-2 text-sm text-ink-800 ${className}`} {...props} />
}

export const inputClass = controlClass
