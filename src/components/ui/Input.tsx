import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const fieldClass =
  'min-h-11 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-white outline-none transition placeholder:text-aura-muted/70 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-200/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, className)} {...props} />
))

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, 'min-h-32 resize-y', className)} {...props} />
))

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, className)} {...props} />
))

Input.displayName = 'Input'
Textarea.displayName = 'Textarea'
Select.displayName = 'Select'
