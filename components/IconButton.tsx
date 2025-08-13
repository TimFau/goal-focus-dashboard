'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'success' | 'danger'
  size?: 'sm' | 'md'
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...rest
}, ref) {
  const classes = [
    'icon-btn',
    size === 'sm' ? 'icon-btn-sm' : '',
    variant === 'success' ? 'icon-btn--success' : '',
    variant === 'danger' ? 'icon-btn--danger' : '',
    className
  ].filter(Boolean).join(' ')
  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      {children}
    </button>
  )
})

export function CheckIconButton(props: Omit<Props, 'children'> & { label?: string }) {
  const { label = 'Mark task as done and remove from Carry Over', ...rest } = props
  return (
    <IconButton aria-label={label} title={label} variant="success" {...rest}>✓</IconButton>
  )
} 