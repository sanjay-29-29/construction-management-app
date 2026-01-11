import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Edit, Loader2, PlusIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ROLES } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';
import { cn } from '@/lib/utils';
import type { Material, Order } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';


const materialSchema = z
  .object({
    name: z.string().min(1),
    quantity: z.number().nonnegative(),
    unit: z.string().min(1),
    receivedQuantity: z.number().nonnegative(),
    price: z.number().nonnegative(),
  })
  .refine(
    (data) =>
      data.receivedQuantity == null || data.receivedQuantity <= data.quantity,
    {
      path: ['receivedQuantity'],
      message: 'Received quantity must be less than or equal to quantity',
    }
  );

const updateOrderSchema = z
  .object({
    materials: z.array(materialSchema),
    paid: z
      .number()
      .nonnegative('Amount paid must be greater than or equal to 0')
      .optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.paid) return true;

      const totalPrice = data.materials.reduce(
        (sum, material) => sum + material.price * material.quantity,
        0
      );
      return data.paid <= totalPrice;
    },
    {
      path: ['paid'],
      message: 'Paid amount cannot exceed total material cost',
    }
  );

type UpdateMaterialFormValues = z.infer<typeof updateOrderSchema>;

export type OrderMaterialGridContainerType = {
  order?: Order;
};

export const OrderMaterialGridContainer = ({
  order,
}: OrderMaterialGridContainerType) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditable, setIsEditable] = useState<boolean>(false);

  const form = useForm<UpdateMaterialFormValues>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: {
      materials: [],
    },
  });

  const { fields, replace, remove, append } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const normalizeMaterials = (materials: Material[]) =>
    materials.map((m) => ({
      ...m,
      receivedQuantity: m.receivedQuantity ?? undefined,
    }));

  const resetMaterailForm = () => {
    const normalizedMaterials = normalizeMaterials(order?.materials || []);
    form.reset({
      materials: normalizedMaterials,
      remarks: order?.remarks,
    });
    replace(normalizedMaterials);
  };

  const mutation = useMutation({
    mutationFn: async (data: UpdateMaterialFormValues) => {
      await client.patch(`orders/${order?.id}/`, data);
    },
    onSuccess: () => {
      toast.success('The values were updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['orders', order?.id],
      });
      setIsEditable(false);
    },
    onError: () => toast.error('Error occurred while updating materails.'),
  });

  const onSubmit = (data: UpdateMaterialFormValues) => {
    mutation.mutate(data);
  };

  const onError = () => {
    toast.error('Error', {
      description: 'Some field(s) need attention',
    });
  };

  useEffect(() => {
    if (order) {
      resetMaterailForm();
    }
  }, [order]);

  // boolean values
  const isHeadOffice = user?.role === ROLES.HEAD_OFFICE;
  const isOrderIncomplete = order?.isCompleted === false;
  const hasMaterials = (order?.materials?.length ?? 0) > 0;
  const isProcessing = mutation.isPending;

  const canEditAllColumns = isHeadOffice && !isProcessing && isEditable;
  const showEditButton =
    !isEditable && isOrderIncomplete && (isHeadOffice || hasMaterials);

  const disabledClass = 'bg-muted text-muted-foreground cursor-not-allowed';

  const materialColumnDefs: ColDef[] = [
    {
      headerName: 'Material Name',
      field: 'name',
      minWidth: 150,
      flex: 1,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.name;

        return (
          <Input
            value={params.value ?? ''}
            placeholder="Material name"
            disabled={!canEditAllColumns}
            className={cn(
              'h-9',
              !canEditAllColumns && disabledClass,
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            onChange={(e) => {
              const value = e.target.value;
              params.node.setDataValue('name', value);
              form.setValue(`materials.${rowIndex}.name`, value);
            }}
          />
        );
      },
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError =
          !!form.formState.errors.materials?.[rowIndex]?.quantity;

        return (
          <Input
            placeholder="Quantity"
            type="number"
            step="0.01"
            value={params.value || ''}
            disabled={!canEditAllColumns}
            className={cn(
              'h-9 w-full',
              !canEditAllColumns && disabledClass,
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            onChange={(e) => {
              const value = Number(e.target.value);
              params.node.setDataValue('quantity', value);
              form.setValue(`materials.${rowIndex}.quantity`, value);
            }}
          />
        );
      },
    },
    {
      headerName: 'Unit',
      field: 'unit',
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.unit;

        return (
          <Input
            value={params.data.unit ?? ''}
            placeholder="Unit"
            disabled={!canEditAllColumns}
            className={cn(
              'h-9 w-full',
              !canEditAllColumns && disabledClass,
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            onChange={(e) => {
              const value = e.target.value;
              params.node.setDataValue('unit', value);
              form.setValue(`materials.${rowIndex}.unit`, value);
            }}
          />
        );
      },
    },
    {
      headerName: 'Received Quantity',
      field: 'receivedQuantity',
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError =
          !!form.formState.errors.materials?.[rowIndex]?.receivedQuantity;

        return (
          <Input
            value={params.value || ''}
            placeholder="Received Quantity"
            disabled={!isEditable}
            type="number"
            step="0.01"
            className={cn(
              'h-9 w-full',
              !isEditable && disabledClass,
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            endContent={params.data.unit}
            onChange={(e) => {
              const value = Number(e.target.value);
              params.node.setDataValue('receivedQuantity', value);
              form.setValue(`materials.${rowIndex}.receivedQuantity`, value);
            }}
          />
        );
      },
    },
    {
      headerName: 'Price',
      field: 'price',
      minWidth: 120,
      hide: !isHeadOffice,
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        const hasError = !!form.formState.errors.materials?.[rowIndex]?.price;

        return (
          <Input
            type="number"
            step={'0.01'}
            startContent="₹"
            value={params.value || ''}
            disabled={!canEditAllColumns}
            className={cn(
              'h-9',
              !canEditAllColumns && disabledClass,
              hasError && 'border-red-500 focus-visible:ring-red-500'
            )}
            onChange={(e) => {
              const value = Number(e.target.value);
              params.node.setDataValue('price', value);
              form.setValue(`materials.${rowIndex}.price`, value);
            }}
          />
        );
      },
    },
    {
      headerName: 'Cost',
      minWidth: 120,
      hide: !isHeadOffice,
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
            className={cn(
              'h-9 text-right',
              isPinned ? 'bg-primary/10 font-bold' : 'bg-muted'
            )}
            disabled
          />
        );
      },
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Actions',
      minWidth: 100,
      hide: !(isHeadOffice && isEditable),
      cellRenderer: (params: ICellRendererParams) => {
        const rowIndex = params.node?.rowIndex;
        const isPinned = params.node.rowPinned === 'bottom';

        if (isPinned || rowIndex == null) return null;

        return (
          <Button
            type="button"
            variant="outline"
            disabled={!canEditAllColumns}
            onClick={() => remove(rowIndex)}
            className="h-9 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Materials Ordered
        </h3>
        <div className="flex gap-2">
          {isEditable && isHeadOffice && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() =>
                append({
                  name: '',
                  quantity: 0,
                  unit: '',
                  price: 0,
                  receivedQuantity: 0,
                })
              }
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          )}

          {showEditButton && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setIsEditable(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          <div className="w-full max-h-90 overflow-auto overflow-x-auto h-full create-order">
            <AgGridReact
              rowData={fields}
              domLayout="autoHeight"
              columnDefs={materialColumnDefs}
              getRowId={(params) => params.data.id}
              defaultColDef={{ sortable: false }}
              rowHeight={52}
              headerHeight={44}
              suppressRowHoverHighlight
              suppressMovableColumns
              suppressCellFocus
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
            />
          </div>

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter any additional remarks or observations..."
                    disabled={!isEditable}
                    className="resize-none min-h-25 bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditable && (
            <div className="flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  if (order) {
                    resetMaterailForm();
                  }
                  setIsEditable(false);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              <Button
                variant="outline"
                onClick={form.handleSubmit(onSubmit, onError)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};
