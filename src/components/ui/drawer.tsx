import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close

const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn('fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in', className)}
        {...props}
    />
))
DrawerOverlay.displayName = 'DrawerOverlay'

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { width?: string }
>(({ className, children, width = 'sm:max-w-[600px]', ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DrawerOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                // Mobile: full screen bottom sheet
                // Desktop: right-side drawer
                'fixed z-50 bg-background shadow-xl flex flex-col',
                'inset-x-0 bottom-0 rounded-t-2xl max-h-[95vh]',
                'sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:h-full sm:rounded-none sm:rounded-l-xl',
                'data-[state=open]:animate-fade-in',
                width,
                className
            )}
            {...props}
        >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
))
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex items-center justify-between border-b px-5 py-4 flex-shrink-0', className)} {...props} />
)

const DrawerTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn('text-base font-semibold', className)} {...props} />
)

const DrawerBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4 scrollbar-thin', className)} {...props} />
)

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex justify-end gap-2 border-t px-5 py-4 flex-shrink-0 safe-area-pb', className)} {...props} />
)

const DrawerCloseButton = () => (
    <DialogPrimitive.Close className="rounded-lg p-1.5 opacity-70 hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
        <X className="h-4 w-4" />
    </DialogPrimitive.Close>
)

export { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerClose, DrawerCloseButton }
