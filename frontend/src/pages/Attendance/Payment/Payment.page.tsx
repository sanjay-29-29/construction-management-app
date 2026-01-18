import { client } from '@/axios';
import { Scaffold } from '@/components/Scaffold';
import type { Labour } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn, formatNumber } from '@/lib/utils';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo } from 'react';
import { LoaderPage } from '@/components/LoaderPage';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const weekPaymentFormSchema = z.object({
  payments: z.array(
    z.object({
      labour: z.string().min(1, 'Labour Week Assignment ID is required'),
      amountPaid: z.coerce
        .number<number>()
        .nonnegative('Amount paid cannot be negative'),
    })
  ),
});

type WeekPaymentFormData = z.infer<typeof weekPaymentFormSchema>;

export const PaymentPage = () => {
  const { siteId, weekId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isError, isLoading } = useQuery<Labour[]>({
    queryKey: ['sites', siteId, 'weeks', weekId, 'payment'],
    queryFn: async () => {
      const response = await client.get(`weeks/${weekId}/payment/`);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: WeekPaymentFormData) => {
      await client.patch(`sites/${siteId}/weeks/${weekId}/`, {
        payments: values.payments,
      });
    },
    onSuccess: () => {
      toast.success('The attendance values are saved successfully');
      navigate(`/sites/${siteId}/weeks/${weekId}`, { replace: true });
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'weeks', weekId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while saving attendance values.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const form = useForm<WeekPaymentFormData>({
    resolver: zodResolver(weekPaymentFormSchema),
    defaultValues: { payments: [] },
  });

  const columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Labour Name',
      width: 200,
      cellClass:
        'font-medium border-slate-200 flex items-center justify-center',
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
      cellClass: 'font-medium flex items-center justify-center',
    },
    {
      field: 'totalDueToPay',
      headerName: 'To Pay',
      width: 120,
      cellClass: 'bg-violet-50 font-semibold flex items-center justify-center',
      valueFormatter: (params) => `₹ ${formatNumber(params.value)}`,
    },
    {
      field: 'amountPaid',
      minWidth:120,
      flex: 1,
      headerName: 'Wage for Week',
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node.rowIndex;
        if (rowIndex == null) return;

        return (
          <FormField
            control={form.control}
            name={`payments.${rowIndex}.amountPaid`}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                startContent={'₹'}
                type="number"
                className={cn(
                  'h-9',
                  fieldState.error &&
                    'border-red-500 focus-visible:ring-red-500'
                )}
              />
            )}
          />
        );
      },
    },
  ];

  const { reset } = form;

  const transformedData = useMemo(
    () =>
      data?.map((val) => ({
        labour: val.weekLinkId,
        name: val.name,
        gender: val.gender,
        totalDueToPay: val.totalDueToDate ?? 0,
        amountPaid: val.amountPaid ?? 0,
      })),
    [data]
  );

  useEffect(() => {
    reset({
      payments: transformedData,
    });
  }, [reset, transformedData]);

  if (isLoading) {
    return <LoaderPage />;
  }

  const handleSubmit = (data: WeekPaymentFormData) => mutation.mutate(data);

  if (isError) return <Navigate to="/sites" replace />;

  return (
    <Scaffold title="Week Payment">
      <div className="flex-1 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-2 h-full">
              <div className="h-120 create-order">
                <AgGridReact
                  suppressCellFocus
                  suppressMovableColumns
                  columnDefs={columnDefs}
                  rowData={form.getValues('payments')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                  variant="outline"
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="outline">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Scaffold>
  );
};
