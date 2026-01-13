import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Auth';
import { formatDate, formatNumber } from '@/lib/utils';
import type { RateWork } from '@/types';

import { RateWorkPaymentCreateDialog } from './RateWorkPaymentCreate.container';

export const RateWorkPayments = ({ data }: { data?: RateWork }) => {
  const queryClient = useQueryClient();
  const { isHeadOffice } = useAuth();
  const { siteId, rateWorkId } = useParams();
  const [isCreatePaymentDialogOpen, setCreatePaymentDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<null | string>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`rate-work/${rateWorkId}/payments/${id}/`);
    },
    onSuccess: () => {
      toast.success('Labour removed successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'rate-work', rateWorkId],
      });
      setPaymentToDelete(null);
    },
    onError: () => {
      toast.error('Error removing labour');
    },
  });

  return (
    <>
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-xl">Past Payments</div>
          {!data?.isCompleted && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreatePaymentDialog(true)}
            >
              <Plus /> Add Payment Entry
            </Button>
          )}
        </div>
        <div className="grid gap-4">
          {data?.payments.length === 0 && (
            <div className="text-muted-foreground text-center mt-32">
              No payments found.
            </div>
          )}
          {data?.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-white"
            >
              <div className="grid gap-1">
                <span className="font-medium block text-gray-900">
                  ₹ {formatNumber(payment.amount)}
                </span>
                <span className="text-xs text-gray-600 line-clamp-1">
                  {payment.note ? payment.note : 'No note available.'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(payment.dateCreated)}
                </span>
              </div>
              {isHeadOffice && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    setPaymentToDelete(payment.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <AlertDialog
          open={!!paymentToDelete}
          onOpenChange={(open) => !open && setPaymentToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                This will remove the payment. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
                onClick={(e) => {
                  // Prevent auto-closing so we can show loading state
                  e.preventDefault();
                  if (paymentToDelete) {
                    deleteMutation.mutate(paymentToDelete);
                  }
                }}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <RateWorkPaymentCreateDialog
        dialogOpen={isCreatePaymentDialogOpen}
        setDialogOpen={setCreatePaymentDialog}
      />
    </>
  );
};
