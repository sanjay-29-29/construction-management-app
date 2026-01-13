import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { isAxiosError } from 'axios';
import { ChevronsUpDown, Loader2, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DropdownType, Vendor } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const materialSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid name.' }),
  quantity: z.number().nonnegative('Quantity must be not negative'),
  unit: z.string().min(1, { error: 'Please enter a valid unit.' }),
  price: z.number().nonnegative('Price must be not negative.'),
});

const createOrderSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid order name.' }),
  number: z.string().min(1, { error: 'Please enter a valid order number.' }),
  site: z.string().min(1, { error: 'Please select a valid site.' }),
  paid: z.coerce
    .number<number>()
    .nonnegative('Amount paid must be greater than or equal to 0')
    .optional(),
  materials: z
    .array(materialSchema)
    .min(1, 'At least one material is required'),
});

type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

export const CreateOrderPage = () => {
  const { vendorId } = useParams();
  const [open, setOpen] = useState(false);

  const {
    data: vendor,
    isLoading: vendorLoading,
    isError: vendorError,
  } = useQuery({
    queryKey: ['vendors', vendorId],
    queryFn: async () => {
      const response = await client.get<Vendor>(`vendors/${vendorId}/`);
      return response.data;
    },
  });

  const {
    data: siteDropdown,
    isLoading: siteDropdownLoading,
    isError: siteDropdownError,
  } = useQuery({
    queryKey: ['sites', 'dropdown'],
    queryFn: async () => {
      const response = await client.get<DropdownType[]>(`sites/dropdown/`);
      return response.data;
    },
  });

  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      name: '',
      site: '',
      number: '',
      paid: 0,
      materials: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateOrderFormValues) => {
      await client.post('orders/', { ...data, vendor: vendorId });
    },
    onSuccess: () => {
      toast.success('Order Created Successfully.');
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('An error occurred while creating order.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const onSubmit = (data: CreateOrderFormValues) => {
    mutation.mutate(data);
  };

  const onError = () => {
    toast.error('Some field(s) need attention');
  };

  const materialColumnDefs: ColDef[] = [
    {
      headerName: 'Material Name',
      field: 'name',
      minWidth: 150,
      width: 200,
      flex: 1,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.name;

        return (
          <Input
            value={params.value || ''}
            placeholder="Material name"
            disabled={mutation.isPending}
            onChange={(e) => {
              params.node.setDataValue('name', e.target.value);
              form.setValue(`materials.${rowIndex}.name`, e.target.value, {});
            }}
            className={cn(
              'h-9',
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        );
      },
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      minWidth: 100,
      width: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError =
          !!form.formState.errors.materials?.[rowIndex]?.quantity;

        return (
          <Input
            type="number"
            step="0.01"
            value={params.value || ''}
            placeholder="Quantity"
            disabled={mutation.isPending}
            onChange={(e) => {
              const value = Number(e.target.value);
              params.node.setDataValue('quantity', value);
              form.setValue(`materials.${rowIndex}.quantity`, value);
            }}
            className={cn(
              'h-9 w-full',
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        );
      },
    },
    {
      headerName: 'Unit',
      field: 'unit',
      minWidth: 100,
      width: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.unit;

        return (
          <Input
            placeholder="Unit"
            value={params.data.unit ?? ''}
            disabled={mutation.isPending}
            onChange={(e) => {
              const value = e.target.value;
              params.node.setDataValue('unit', value);
              form.setValue(`materials.${rowIndex}.unit`, value);
            }}
            className={cn(
              'h-9 w-full',
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        );
      },
    },
    {
      headerName: 'Price',
      field: 'price',
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.price;

        return (
          <Input
            type="number"
            startContent="₹"
            step="0.01"
            placeholder="0.00"
            value={params.value || ''}
            disabled={mutation.isPending}
            onChange={(e) => {
              const value = Number(e.target.value);
              params.node.setDataValue('price', value);
              form.setValue(`materials.${rowIndex}.price`, value);
            }}
            className={cn(
              'h-9',
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        );
      },
    },
    {
      headerName: 'Cost',
      minWidth: 120,
      width: 140,
      valueGetter: (params) => {
        if (params.node?.rowPinned === 'bottom') {
          let total = 0;
          params.api.forEachNode((node) => {
            if (!node.rowPinned) {
              const qty = Number(node.data?.quantity || 0);
              const price = Number(node.data?.price || 0);
              total += qty * price;
            }
          });
          return total.toFixed(2);
        }

        // For regular rows
        const qty = Number(params.data?.quantity || 0);
        const price = Number(params.data?.price || 0);
        return (qty * price).toFixed(2);
      },
      cellRenderer: (params: ICellRendererParams) => {
        const isPinned = params.node.rowPinned === 'bottom';
        return (
          <Input
            value={params.value}
            startContent="₹"
            type="number"
            step="0.01"
            className={cn(
              'h-9 text-right',
              isPinned ? 'bg-primary/10 font-bold' : 'bg-muted'
            )}
            disabled
          />
        );
      },
      editable: false,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 100,
      width: 110,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        return (
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={() => remove(rowIndex)}
            disabled={mutation.isPending}
            className="h-9 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Remove
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    if (vendorError || siteDropdownError) {
      toast.error('An error occurred while fetching data');
    }
  }, [vendorError, siteDropdownError]);

  if (vendorLoading || siteDropdownLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Create Order" disablePadding>
      <div className="p-4 bg-white flex-1 pb-20 lg:m-4 lg:rounded-md lg:flex-initial lg:p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cement Order"
                      type="text"
                      autoComplete="off"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter order name</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="KS101"
                      type="text"
                      autoComplete="off"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter order number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Vendor Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="off"
                  className="bg-muted"
                  value={vendor?.name}
                  disabled
                />
              </FormControl>
              <FormDescription>Select vendor</FormDescription>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={mutation.isPending || siteDropdownLoading}
                          className="justify-between font-normal"
                        >
                          {field.value
                            ? siteDropdown?.find((s) => s.value === field.value)
                                ?.label
                            : 'Select site'}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-(--radix-popover-trigger-width) max-h-64 overflow-y-auto">
                      <Command>
                        <CommandInput placeholder="Select Site" />
                        <CommandList>
                          <CommandEmpty>No site found.</CommandEmpty>
                          <CommandGroup>
                            {siteDropdown?.map((s) => (
                              <CommandItem
                                key={s.value}
                                value={String(s.value)}
                                onSelect={() => {
                                  field.onChange(s.value);
                                  setOpen(false);
                                }}
                              >
                                {s.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Select site</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      startContent={'₹'}
                      step="0.01"
                      placeholder="0.00"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>Enter amount paid</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 my-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materials</h3>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    append({ name: '', quantity: 0, unit: '', price: 0 })
                  }
                >
                  <span>
                    <PlusIcon />
                  </span>
                  Add Material
                </Button>
              </div>
              <div className="w-full max-h-100 overflow-auto h-100 create-order">
                <AgGridReact
                  rowData={fields}
                  domLayout="normal"
                  columnDefs={materialColumnDefs}
                  getRowId={(params) => params.data.id}
                  defaultColDef={{ sortable: false }}
                  pinnedBottomRowData={[{}]}
                  onCellValueChanged={(params) => {
                    const pinnedRow = params.api.getPinnedBottomRow(0);
                    if (pinnedRow) {
                      params.api.refreshCells({
                        rowNodes: [pinnedRow],
                        force: true,
                      });
                    }
                  }}
                  rowHeight={52}
                  headerHeight={44}
                  suppressRowHoverHighlight
                  suppressMovableColumns
                  suppressCellFocus
                />
              </div>
            </div>
            <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t px-4 py-3 lg:static lg:mt-6 lg:flex lg:justify-end lg:bg-transparent lg:border-none lg:p-0">
              <Button className="w-full h-12 text-base font-medium lg:w-auto lg:h-auto">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Scaffold>
  );
};
