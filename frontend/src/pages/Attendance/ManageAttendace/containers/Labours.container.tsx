import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Trash2, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';
import type { DropdownType, Labour } from '@/types';

const addLabourSchema = z.object({
  labour: z.string('Please select a labour'),
  weeklyDailyWage: z.coerce
    .number<number>()
    .positive('Wage must be greater than 0'),
});

type AddLabourFormValues = z.infer<typeof addLabourSchema>;

const AddLabourDialog = ({
  existingLabours,
}: {
  existingLabours: Labour[];
}) => {
  const { siteId, weekId } = useParams();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: availableLabours, isLoading: isLoadingLabours } = useQuery({
    queryKey: ['sites', siteId, 'labours', 'dropdown', 1],
    queryFn: async () => {
      const res = await client.get<DropdownType[]>(
        `sites/${siteId}/labours/dropdown/?type=1`
      );
      return res.data;
    },
    enabled: open,
  });

  const form = useForm<AddLabourFormValues>({
    resolver: zodResolver(addLabourSchema),
    defaultValues: {
      weeklyDailyWage: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: AddLabourFormValues) => {
      await client.post(`sites/${siteId}/weeks/${weekId}/labours/`, {
        ...values,
        week: weekId,
      });
    },
    onSuccess: () => {
      toast.success('Labour added to schedule');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        toast.error('Labour likely already added to this week.');
      } else {
        toast.error('Failed to add labour.');
      }
    },
  });

  const onSubmit = (values: AddLabourFormValues) => {
    createMutation.mutate(values);
  };

  const selectableLabours = availableLabours?.filter(
    (l) => !existingLabours.some((existing) => existing.id === l.value)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          Add Labour
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Labour to Week</DialogTitle>
          <DialogDescription>
            Select a labour from the site list and assign their daily wage for
            this week.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            {/* Labour Selection */}
            <FormField
              control={form.control}
              name="labour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labour</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        disabled={
                          isLoadingLabours || selectableLabours?.length === 0
                        }
                        className="w-full h-9"
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLabours ? 'Loading...' : 'Select a labour'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-(--radix-popover-trigger-width)">
                      {selectableLabours?.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          All site labours already added.
                        </div>
                      ) : (
                        selectableLabours?.map((labour) => (
                          <SelectItem key={labour.value} value={labour.value}>
                            {labour.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wage Input */}
            <FormField
              control={form.control}
              name="weeklyDailyWage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Wage (₹)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      startContent={'₹'}
                      step="0.01"
                      placeholder="0.00"
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Labour
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const LabourContainer = ({
  data,
  isEditable,
}: {
  data?: Labour[];
  isEditable?: boolean;
}) => {
  const { siteId, weekId } = useParams();
  const queryClient = useQueryClient();

  const [labourToDelete, setLabourToDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`sites/${siteId}/weeks/${weekId}/labours/${id}/`);
    },
    onSuccess: () => {
      toast.success('Labour removed successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
      // Close dialog on success
      setLabourToDelete(null);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while removing labour.');
      }
      toast.error('Unknown error occurred.');
    },
  });

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold text-gray-900">
          This Week's Labours
        </div>
        {isEditable && <AddLabourDialog existingLabours={data || []} />}
      </div>

      {!data || data.length === 0 ? (
        <div className="text-sm text-center border rounded-md bg-gray-50 p-12 text-gray-500">
          No labours added to this week yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {data.map((labour) => {
            return (
              <div
                key={labour.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-white"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium block text-gray-900">
                    {labour.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Wage:{' '}
                    <span className="text-gray-700">
                      ₹ {formatNumber(labour.weeklyDailyWage)}
                    </span>
                  </span>
                </div>
                {isEditable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      if (labour.weekLinkId) {
                        setLabourToDelete(labour.weekLinkId);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!labourToDelete}
        onOpenChange={(open) => !open && setLabourToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              This will remove the labour from this week's schedule. This action
              cannot be undone.
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
                if (labourToDelete) {
                  deleteMutation.mutate(labourToDelete);
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
  );
};
