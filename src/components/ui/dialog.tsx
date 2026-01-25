"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, GripHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

// Hook for draggable functionality
function useDraggable(enabled: boolean, isOpen: boolean) {
  // Position is the offset from center (0,0 = centered)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  // Store the mouse position relative to dialog top-left when drag starts
  const dragStart = React.useRef({ mouseX: 0, mouseY: 0, dialogX: 0, dialogY: 0 });

  // Reset position when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!enabled || !dialogRef.current) return;

    // Only start drag if clicking on the header/drag handle
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest('[data-drag-handle]');
    if (!isDragHandle) return;

    e.preventDefault();

    // Get dialog's current position on screen
    const rect = dialogRef.current.getBoundingClientRect();

    // Store starting positions
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      dialogX: rect.left,
      dialogY: rect.top,
    };

    setIsDragging(true);
  }, [enabled]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate how far the mouse has moved since drag started
      const deltaX = e.clientX - dragStart.current.mouseX;
      const deltaY = e.clientY - dragStart.current.mouseY;

      // Update offset (this is added to the centered position)
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      // Update the start position for next move event
      dragStart.current.mouseX = e.clientX;
      dragStart.current.mouseY = e.clientY;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return { offset, isDragging, dialogRef, handleMouseDown };
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      style={style}
      {...props}
    />
  )
}

// Context to track dialog open state for draggable functionality
const DialogOpenContext = React.createContext<boolean>(false);

function DialogContent({
  className,
  children,
  showCloseButton = true,
  draggable = false,
  style,
  onInteractOutside,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  draggable?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { offset, isDragging, dialogRef, handleMouseDown } = useDraggable(draggable, isOpen);

  // Handler to prevent dialog from closing when clicking on feedback button
  const handleInteractOutside = React.useCallback((event: { target: EventTarget | null; preventDefault: () => void }) => {
    const target = event.target as HTMLElement | null;
    // Check if click is on the feedback button or its container
    if (target?.closest?.('[data-feedback-button]')) {
      event.preventDefault();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onInteractOutside?.(event as any);
  }, [onInteractOutside]);

  const handlePointerDownOutside = React.useCallback((event: { target: EventTarget | null; preventDefault: () => void }) => {
    const target = event.target as HTMLElement | null;
    // Check if click is on the feedback button or its container
    if (target?.closest?.('[data-feedback-button]')) {
      event.preventDefault();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPointerDownOutside?.(event as any);
  }, [onPointerDownOutside]);

  // Track when dialog is actually rendered/visible
  React.useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, []);

  // Apply offset as inline style - offset is relative to centered position
  const transformStyle: React.CSSProperties = draggable ? {
    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
    ...style,
  } : { ...style };

  // Extract zIndex from style for overlay (if provided)
  const overlayZIndex = style?.zIndex ? { zIndex: Number(style.zIndex) - 1 } : undefined;

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay style={overlayZIndex} />
      <DialogPrimitive.Content
        ref={dialogRef}
        data-slot="dialog-content"
        onMouseDown={draggable ? handleMouseDown : undefined}
        onInteractOutside={handleInteractOutside}
        onPointerDownOutside={handlePointerDownOutside}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          !draggable && "translate-x-[-50%] translate-y-[-50%]",
          isDragging && "cursor-grabbing select-none transition-none",
          className
        )}
        style={transformStyle}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full opacity-70 transition-opacity hover:opacity-100 hover:bg-muted focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <XIcon className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  draggable = false,
  ...props
}: React.ComponentProps<"div"> & { draggable?: boolean }) {
  return (
    <div
      data-slot="dialog-header"
      data-drag-handle={draggable ? true : undefined}
      className={cn(
        "flex flex-col gap-2 text-center sm:text-left",
        draggable && "cursor-grab active:cursor-grabbing select-none",
        className
      )}
      {...props}
    >
      {draggable && (
        <div className="flex justify-center -mt-2 mb-1 opacity-40">
          <GripHorizontal className="h-4 w-4" />
        </div>
      )}
      {props.children}
    </div>
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
