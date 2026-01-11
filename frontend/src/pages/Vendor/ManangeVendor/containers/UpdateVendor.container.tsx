import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Vendor } from '@/types';

export type UpdateVendorContainerProps = {
  vendor?: Vendor;
  isDialogOpen: boolean;
  setDialog: Dispatch<SetStateAction<boolean>>;
};

const updateVendorSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid name' }),
  address: z.string().min(1, { error: 'Please enter a valid address' }),
  notes: z.string().optional(),
});

type UpdateVendorFormValues = z.infer<typeof updateVendorSchema>;

export const UpdateVendorContainer = ({
  vendor,
  isDialogOpen: isDialoagOpen,
  setDialog,
}: UpdateVendorContainerProps) => {
  const queryClient = useQueryClient();

  const form = useForm<UpdateVendorFormValues>({
    resolver: zodResolver(updateVendorSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateVendorFormValues) => {
      await client.patch(`vendors/${vendor?.id}/`, data);
    },
    onSuccess: () => {
      setDialog(false);
      toast.success('The vendor was updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['vendors', vendor?.id],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while updating vendor.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  const onSubmit = (data: UpdateVendorFormValues) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (isDialoagOpen && vendor) {
      form.reset(vendor);
    }
  }, [form, vendor, isDialoagOpen]);

  return (
    <Dialog open={isDialoagOpen} onOpenChange={setDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Vendor</DialogTitle>
          <DialogDescription>
            Make changes to vendor here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 mb-4">
              {/* Vendor Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Steel Vendor"
                        autoComplete="off"
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>Enter name of the vendor</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123, Street Name, Area, City"
                        autoComplete="off"
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter address of the vendor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add internal references..."
                        autoComplete="off"
                        className="placeholder:text-muted-foreground text-sm"
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>Enter notes of the vendor</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button
            className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setDialog(false);
              form.clearErrors();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
