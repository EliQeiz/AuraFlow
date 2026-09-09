import { LoaderCircle } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Link, type LinkProps } from 'react-router-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode
  loading?: boolean
  variant?: ButtonVariant
}

export function Button({
  children,
  className,
  disabled,
  loading,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={cn('af-button', `af-button--${variant}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </motion.button>
  )
}

interface ButtonLinkProps extends PropsWithChildren<LinkProps> {
  variant?: ButtonVariant
  className?: string
}
export function ButtonLink({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn('af-button', `af-button--${variant}`, className)}
      {...props}
    >
      {children}
    </Link>
  )
}
