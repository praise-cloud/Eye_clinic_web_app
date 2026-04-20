interface AvatarProps {
  src?: string
  alt?: string
  firstName?: string
  lastName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, alt, firstName = '', lastName = '', size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const initials = `${firstName.charAt('')}${lastName.charAt('')}`.toUpperCase() || '?'

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt || `${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium`}>
      {initials}
    </div>
  )
}