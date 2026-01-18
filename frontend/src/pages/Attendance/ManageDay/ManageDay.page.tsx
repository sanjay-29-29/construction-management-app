import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_DROPDOWN } from '@/constants';
import { cn, formatDate } from '@/lib/utils';
import type { AttendanceEntry, DailyEntry, Labour } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const attendanceRowSchema = z.object({
  labour: z.string().min(1, 'Labour ID is required'),
  name: z.string().min(1, 'Name is required'),
  isPresent: z.boolean(),
  advanceTaken: z.coerce
    .number<number>()
    .nonnegative('Advance cannot be negative'),
  paymentType: z.number(),
});

const formSchema = z.object({
  rows: z.array(attendanceRowSchema),
});

type AttendanceFormData = z.infer<typeof formSchema>;

export const ManageDay = () => {
  const { siteId, weekId, dayId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isError, isLoading } = useQuery<DailyEntry>({
    queryKey: ['sites', siteId, 'weeks', weekId, 'days', dayId],
    queryFn: async () => {
      const response = await client.get(
        `sites/${siteId}/weeks/${weekId}/days/${dayId}/`
      );
      return response.data;
    },
    gcTime: 0,
    staleTime: 0,
  });

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { rows: [] },
  });

  const { reset } = form;

  const transformDataForForm = useCallback(
    (apiData: DailyEntry): AttendanceFormData => {
      const { attendance, labours } = apiData;

      const rows = labours.map((labour: Labour) => {
        const record = attendance.find(
          (a: AttendanceEntry) => a.labour === labour.id
        );

        return {
          labour: labour.id,
          name: labour.name,
          gender: labour.gender,
          isPresent: record?.isPresent ?? false,
          advanceTaken: record?.advanceTaken ?? 0,
          paymentType: record?.paymentType ?? 1,
        };
      });

      return { rows };
    },
    []
  );

  const mutation = useMutation({
    mutationFn: async (values: AttendanceFormData) => {
      const attendances = values.rows.map((row) => ({
        ...row,
      }));
      await client.patch(`sites/${siteId}/weeks/${weekId}/days/${dayId}/`, {
        attendances,
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

  const handleSubmit = (data: AttendanceFormData) => mutation.mutate(data);

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Labour Name',
        pinned: 'left',
        width: 250,
      },
      {
        field: 'gender',
        headerName: 'Gender',
        width: 100,
      },
      {
        headerName: 'Present',
        width: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex == null) return;

          return (
            <FormField
              control={form.control}
              name={`rows.${rowIndex}.isPresent`}
              render={({ field }) => (
                <div className="flex justify-center w-full">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          );
        },
      },
      {
        headerName: 'Advance',
        minWidth: 140,
        flex: 1,
        cellRenderer: (params: ICellRendererParams) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex == null) return;

          return (
            <FormField
              control={form.control}
              name={`rows.${rowIndex}.advanceTaken`}
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
      {
        headerName: 'Payment Type',
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: ICellRendererParams) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex == null) return;

          return (
            <FormField
              control={form.control}
              name={`rows.${rowIndex}.paymentType`}
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue={String(field.value)}
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 w-full truncate">
                        <SelectValue placeholder="Select Payment Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_DROPDOWN.map((val) => (
                        <SelectItem value={val.value} key={val.value}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          );
        },
      },
    ],
    [form.control, mutation.isPending]
  );

  useEffect(() => {
    if (data) {
      reset(transformDataForForm(data));
      if (data.isEditable === false) {
        navigate(`/sites/${siteId}/weeks/${weekId}`, { replace: true });
      }
    }
  }, [data, siteId, weekId, navigate, reset, transformDataForForm]);

  if (isLoading) {
    return <LoaderPage />;
  }

  if (isError) return <Navigate to="/sites" replace />;

  return (
    <Scaffold title={`Attendance for ${formatDate(data?.date)}`}>
      <div className="flex-1 space-y-4">
        <div className="text-xl font-semibold text-gray-900">
          Attendance for{' '}
          <span className="text-gray-600">{formatDate(data?.date)}</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-2 h-full">
              <div className="h-120 create-order">
                <AgGridReact
                  suppressCellFocus
                  suppressMovableColumns
                  columnDefs={columnDefs}
                  rowData={form.getValues('rows')}
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
