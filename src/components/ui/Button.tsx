import { LoaderCircle } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Link, type LinkProps } from 'react-router-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-aura-gradient text-white shadow-aura hover:brightness-110',
  secondary: 'border border-cyan-200/35 bg-transparent text-cyan-100 hover:border-cyan-200/70 hover:bg-cyan-300/10',
  ghost: 'bg-transparent text-white underline decoration-transparent underline-offset-8 hover:decoration-cyan-200',
  danger: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-lg shadow-rose-950/40',
}

export type ButtonVariant = keyof typeof variants

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode
  loading?: boolean
  variant?: ButtonVariant
}

export function Button({ children, className, disabled, loading, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </motion.button>
  )
}

interface ButtonLinkProps extends PropsWithChildren<LinkProps> {
  variant?: ButtonVariant
  className?: string
}

export function ButtonLink({ children, className, variant = 'primary', ...props }: ButtonLinkProps) {
  return (
    <motion.div className="inline-flex" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
      <Link
        className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition', variants[variant], className)}
        {...props}
      >
        {children}
      </Link>
    </motion.div>
  )
}
