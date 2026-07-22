import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

type FormDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  title: string
  description: string | null
  children: React.ReactNode
}

// re-usable form dialog for all forms except auth

export function FormDialog({
  open,
  setOpen,
  title,
  description = null,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
