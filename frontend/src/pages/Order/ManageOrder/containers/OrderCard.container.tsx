import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Building2,
  Calendar,
  Edit,
  Loader2,
  Store,
  Trash,
  UserCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
  FormField,
} from '@/components/ui/form';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/Auth';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Order } from '@/types';

export type OrderCardContainerType = { order?: Order };

export const OrderCardContainer = ({ order }: OrderCardContainerType) => {
  const { isHeadOffice } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateOrderSchema = z.object({
    name: z.string().min(1, { error: 'Please enter a valid name' }),
    number: z.string().min(1, { error: 'Please enter a order number' }),
    isCompleted: z.boolean(),
    paid: z.coerce
      .number<number>()
      .nonnegative('Amount paid must be greater than or equal to 0')
      .optional(),
  });

  type UpdateOrderFormValues = z.infer<typeof updateOrderSchema>;

  const form = useForm<UpdateOrderFormValues>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: {
      name: '',
      number: '',
      isCompleted: false,
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: UpdateOrderFormValues) => {
      await client.patch(`orders/${order?.id}/`, data);
    },
    onSuccess: () => {
      setUpdateDialogOpen(false);
      toast.success('The order was updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['orders', order?.id],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while updating order.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await client.delete(`orders/${order?.id}/`);
    },
    onSuccess: () => {
      setUpdateDialogOpen(false);
      toast.success('The order was deleted successfully.');
      navigate('/sites', { replace: true });
      queryClient.invalidateQueries({
        queryKey: ['orders', order?.id],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while deleting order.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  const onSubmit = (data: UpdateOrderFormValues) => {
    updateOrderMutation.mutate(data);
  };

  useEffect(() => {
    if (isUpdateDialogOpen && order) {
      form.reset(order);
    }
  }, [order, isUpdateDialogOpen, form]);

  return (
    <Card className="border-l-4 border-l-orange-600 gap-0 shadow-none">
      {/* HEADER */}
      <CardHeader className="pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
              <CardTitle className="text-lg sm:text-xl truncate">
                {order?.name}
              </CardTitle>

              <Badge
                className={`shrink-0 ${
                  order?.isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {order?.isCompleted ? 'Completed' : 'Pending'}
              </Badge>
            </div>
            <div className="text-sm truncate text-muted-foreground">
              {order?.number}
            </div>
          </div>
          <div className="flex gap-2">
            {(isHeadOffice || !order?.isCompleted) && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                disabled={deleteMutation.isPending}
                onClick={() => setUpdateDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {isHeadOffice && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
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
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? (
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

      {/* CONTENT */}
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Vendor & Date */}
        <div className="grid grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="truncate">{order?.site}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Store className="h-4 w-4 text-gray-500" />
              <span className="truncate">{order?.vendor}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{formatDate(order?.createdAt)}</span>
            </div>
          </div>

          {/* Materials & Cost */}
          <div className="grid gap-4">
            <div className="text-right grid gap-4">
              {isHeadOffice && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm font-semibold text-orange-700">
                      ₹ {formatNumber(order?.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-semibold text-green-700">
                      ₹ {formatNumber(order?.paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount To Pay</p>
                    <p className="text-sm font-semibold text-blue-700">
                      ₹{' '}
                      {formatNumber(Number(order?.cost) - Number(order?.paid))}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-xs text-gray-500">Materials</p>
          <p className="text-sm font-semibold">{order?.materials.length}</p>
        </div>

        {/* Completed By */}
        {order?.isCompleted && order?.completedBy && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <UserCircle className="h-4 w-4 text-gray-500" />
              <span>
                Completed by{' '}
                <Link to={`/users/${order.completedBy.id}`}>
                  <span className="font-medium hover:underline hover:cursor-pointer">
                    {`${order.completedBy.firstName} ${order?.completedBy.lastName}`}
                  </span>
                </Link>
              </span>
            </div>
          </>
        )}
      </CardContent>
      <Dialog open={isUpdateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order</DialogTitle>
            <DialogDescription>
              Make changes to order here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-5 mb-4">
                {isHeadOffice && (
                  <>
                    <FormField
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Cement Bags"
                              autoComplete="off"
                              disabled={updateOrderMutation.isPending}
                            />
                          </FormControl>
                          <FormDescription>Enter order name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="number"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              id={field.name}
                              placeholder="KS101"
                              autoComplete="off"
                              disabled={updateOrderMutation.isPending}
                            />
                          </FormControl>
                          <FormDescription>Enter order number</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="paid"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Paid</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              autoComplete="off"
                              disabled={updateOrderMutation.isPending}
                            />
                          </FormControl>
                          <FormDescription>Enter paid amount</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  name="isCompleted"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="font-medium">
                          Order Completed
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Mark this order as received.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={updateOrderMutation.isPending}
                        />
                      </FormControl>
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
              disabled={updateOrderMutation.isPending}
              onClick={() => {
                setUpdateDialogOpen(false);
                form.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={updateOrderMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {updateOrderMutation.isPending ? (
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
    </Card>
  );
};
