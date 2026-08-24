interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const displayName = name?.trim() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={displayName}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      aria-label={displayName}
      className={`inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${sizeClasses[size]} ${className}`}
    >
      {getInitials(displayName)}
    </div>
  )
}
