import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ratePaymentSchema = z.object({
  note: z.string().optional(),
  amount: z.coerce
    .number<number>()
    .positive('Amount paid must be greater than 0.'),
});

type RatePaymentFormValues = z.infer<typeof ratePaymentSchema>;

export const RateWorkPaymentCreateDialog = ({
  dialogOpen,
  setDialogOpen,
}: {
  dialogOpen: boolean;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();
  const { siteId, rateWorkId } = useParams();
  const onSubmit = (data: RatePaymentFormValues) => mutation.mutate(data);

  const form = useForm<RatePaymentFormValues>({
    resolver: zodResolver(ratePaymentSchema),
    defaultValues: {
      amount: 0,
      note: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RatePaymentFormValues) => {
      await client.post(`rate-work/${rateWorkId}/payments/`, {
        ...data,
        siteId: siteId,
      });
    },
    onSuccess: () => {
      setDialogOpen(false);
      toast.success('The payment was created successfully.');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'rate-work'],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while creating payment.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Payment</DialogTitle>
          <DialogDescription>
            Create a payment here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 mb-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount Paid"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>Enter amount paid</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter notes"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter notes for the payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                variant="outline"
                disabled={mutation.isPending}
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="outline" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
