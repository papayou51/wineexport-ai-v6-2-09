import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: "default" | "info" | "warning" | "error" | "success"
  }
>(({ className, sideOffset = 4, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-primary text-primary-foreground",
    info: "bg-blue-500 text-white",
    warning: "bg-orange-500 text-white", 
    error: "bg-destructive text-destructive-foreground",
    success: "bg-green-500 text-white"
  }

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced Tooltip with keyboard support and rich content
interface EnhancedTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  variant?: "default" | "info" | "warning" | "error" | "success"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  shortcut?: string
  className?: string
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  variant = "default",
  side = "top",
  align = "center",
  delayDuration = 300,
  skipDelayDuration = 100,
  disableHoverableContent = false,
  shortcut,
  className
}) => {
  return (
    <TooltipProvider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      <TooltipRoot>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          variant={variant}
          side={side}
          align={align}
          className={className}
        >
          <div className="flex flex-col gap-1">
            <div>{content}</div>
            {shortcut && (
              <div className="text-xs opacity-75 font-mono">
                {shortcut}
              </div>
            )}
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

// Quick tooltip for simple text
interface QuickTooltipProps {
  text: string
  children: React.ReactNode
  variant?: "default" | "info" | "warning" | "error" | "success"
  shortcut?: string
}

const QuickTooltip: React.FC<QuickTooltipProps> = ({
  text,
  children,
  variant = "default",
  shortcut
}) => {
  return (
    <EnhancedTooltip
      content={text}
      variant={variant}
      shortcut={shortcut}
    >
      {children}
    </EnhancedTooltip>
  )
}

// Feature explanation tooltip
interface FeatureTooltipProps {
  title: string
  description: string
  children: React.ReactNode
  learnMoreUrl?: string
}

const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  title,
  description,
  children,
  learnMoreUrl
}) => {
  return (
    <EnhancedTooltip
      variant="info"
      content={
        <div className="max-w-xs">
          <div className="font-medium mb-1">{title}</div>
          <div className="text-xs mb-2">{description}</div>
          {learnMoreUrl && (
            <a 
              href={learnMoreUrl}
              className="text-xs underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              En savoir plus
            </a>
          )}
        </div>
      }
    >
      {children}
    </EnhancedTooltip>
  )
}

export {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  EnhancedTooltip,
  QuickTooltip,
  FeatureTooltip
}