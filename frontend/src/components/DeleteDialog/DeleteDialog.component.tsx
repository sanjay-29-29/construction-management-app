import { Loader2 } from 'lucide-react';

import {
  AlertDialogContent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '../ui/alert-dialog';

export const DeleteDialog = ({
  open,
  description,
  onOpenChange,
  loading,
  onDelete,
}: {
  open: boolean;
  description: string;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onDelete: () => void;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
            </>
          ) : (
            'Delete'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
