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
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Labour } from '@/types';

const updateRateWorkSchema = z.object({
  name: z.string().min(1, 'Enter a valid name.'),
  quantity: z.coerce
    .number<number>()
    .nonnegative('Quantity must be not negative.'),
  costPerUnit: z.coerce
    .number<number>()
    .nonnegative('Cost per unit must be not negative.'),
  unit: z.string().min(1, 'Enter a valid unit.'),
  isCompleted: z.boolean(),
});

type CreateRateWorkFormValues = z.infer<typeof updateRateWorkSchema>;

export const CreateRateWorkDialog = ({
  dialog,
  setDialogState,
}: {
  data?: Labour;
  dialog: boolean;
  setDialogState: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();
  const { labourId, siteId } = useParams();
  const form = useForm<CreateRateWorkFormValues>({
    resolver: zodResolver(updateRateWorkSchema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: '',
      costPerUnit: 0,
      isCompleted: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateRateWorkFormValues) => {
      await client.post(`labours/${labourId}/rate-work/`, data);
    },
    onSuccess: () => {
      setDialogState(false);
      toast.success('The rate work was created successfully.');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while creating rate work.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  useEffect(() => {
    if (!dialog) {
      form.reset();
    }
  }, [dialog, form]);

  const onSubmit = (data: CreateRateWorkFormValues) => mutation.mutate(data);

  return (
    <Dialog open={dialog} onOpenChange={setDialogState}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Rate Work</DialogTitle>
          <DialogDescription>
            Create rate work here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Work</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rate Work"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter name of the rate work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per Unit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter cost per unit"
                        disabled={mutation.isPending}
                        startContent="₹"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter cost per unit.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter quantity of the work.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Unit</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter unit"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter unit of the work.</FormDescription>
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
                  setDialogState(false);
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
