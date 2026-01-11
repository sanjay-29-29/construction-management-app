import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';
import type { AttendanceEntry, DailyEntry, Labour } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';





const attendanceRowSchema = z.object({
  labour: z.string().min(1, 'Labour ID is required'),
  name: z.string().min(1, 'Name is required'),
  isPresent: z.boolean(),
  wageForDay: z.number().nonnegative('Wage cannot be negative'),
  advanceTaken: z.number().nonnegative('Advance cannot be negative'),
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
  });

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { rows: [] },
  });

  const transformDataForForm = (apiData: DailyEntry): AttendanceFormData => {
    const { attendance, labours } = apiData;

    const rows = labours.map((labour: Labour) => {
      const record = attendance.find(
        (a: AttendanceEntry) => a.labour === labour.id
      );

      return {
        labour: labour.id,
        name: labour.name,
        gender: labour.gender,
        isPresent: record ? record.isPresent : false,
        wageForDay: record ? record.wageForDay : 0,
        advanceTaken: record ? record.advanceTaken : 0,
      };
    });

    return { rows };
  };

  useEffect(() => {
    if (data) {
      console.log(transformDataForForm(data));
      form.reset(transformDataForForm(data));
    }
  }, [data, form]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'name',
        headerName: 'Labour Name',
        pinned: 'left',
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
                    onCheckedChange={(val) => {
                      field.onChange(val);
                      if (!val) {
                        form.setValue(`rows.${rowIndex}.wageForDay`, 0);
                        form.setValue(`rows.${rowIndex}.advanceTaken`, 0);
                      }
                    }}
                  />
                </div>
              )}
            />
          );
        },
      },
      {
        headerName: 'Wage',
        minWidth: 140,
        flex: 1,
        cellRenderer: (params: ICellRendererParams) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex == null) return;
          return (
            <FormField
              control={form.control}
              name={`rows.${rowIndex}.wageForDay`}
              render={({ field, fieldState }) => {
                const isPresent = form.watch(`rows.${rowIndex}.isPresent`);
                return isPresent ? (
                  <Input
                    {...field}
                    startContent={'₹'}
                    type="number"
                    className={cn(
                      'h-9',
                      fieldState.error &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : Number(value));
                    }}
                  />
                ) : (
                  <span className="text-gray-400 italic text-xs">N/A</span>
                );
              }}
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
              render={({ field, fieldState }) => {
                const isPresent = form.watch(`rows.${rowIndex}.isPresent`);
                return isPresent ? (
                  <Input
                    {...field}
                    startContent={'₹'}
                    type="number"
                    className={cn(
                      'h-9',
                      fieldState.error &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : Number(value));
                    }}
                  />
                ) : (
                  <span className="text-gray-400 italic text-xs">N/A</span>
                );
              }}
            />
          );
        },
      },
    ],
    [form]
  );

  const mutation = useMutation({
    mutationFn: async (values: AttendanceFormData) => {
      const attendances = values.rows.map((row) => ({
        labour: row.labour,
        is_present: row.isPresent,
        wage_for_day: row.isPresent ? row.wageForDay.toFixed(2) : '0.00',
        advance_taken: row.isPresent ? row.advanceTaken.toFixed(2) : '0.00',
      }));
      try {
        await client.patch(`sites/${siteId}/weeks/${weekId}/days/${dayId}/`, {
          attendances,
        });
        toast.success('The attendance values are saved successfully');
        queryClient.invalidateQueries({
          queryKey: ['sites', siteId, 'weeks', weekId, 'days', dayId],
        });
        navigate(-1);
      } catch (error) {
        if (isAxiosError(error)) {
          toast.error('Error occurred while saving attendance values.');
          return;
        }
        toast.error('Unknown error occurred.');
      }
    },
  });

  const handleSubmit = (data: AttendanceFormData) => mutation.mutate(data);

  if (isError) return <Navigate to="/sites" />;

  if (isLoading && !isError) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title={`Attendance for ${formatDate(data?.date)}`}>
      <div className="p-4 flex-1">
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
