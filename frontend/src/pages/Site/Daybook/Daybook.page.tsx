import { AgGridReact } from 'ag-grid-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Check, ChevronsUpDown, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { DeleteDialog } from '@/components/DeleteDialog';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Entry, Head } from '@/types';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';

import { ManageHeadsTab } from './ManageHeadsDialog';
import { formatDate, formatNumber } from '@/lib/utils';

const createEntrySchema = z.object({
  head: z.string().min(1, 'Please select a head'),
  description: z.string().min(1, 'Please enter a description'),
  amountCr: z.coerce
    .number<number>()
    .nonnegative('Please enter a positive number'),
  amountDb: z.coerce
    .number<number>()
    .nonnegative('Please enter a positive number'),
});

type CreateEntryFormValues = z.infer<typeof createEntrySchema>;

type EntryRow = Entry & { headName: string };

export const Daybook = () => {
  const { siteId } = useParams();
  const queryClient = useQueryClient();

  const [selectedHeadId, setSelectedHeadId] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [headFilterOpen, setHeadFilterOpen] = useState(false);
  const gridRef = useRef<AgGridReact<EntryRow>>(null);

  const handlePrint = useCallback(() => {
    gridRef.current?.api?.setGridOption('domLayout', 'print');
    setTimeout(() => {
      window.print();
      gridRef.current?.api?.setGridOption('domLayout', 'normal');
    }, 500);
  }, []);

  // Create entry form
  const form = useForm<CreateEntryFormValues>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      head: '',
      description: '',
      amountCr: 0,
      amountDb: 0,
    },
  });

  // Fetch entries
  const {
    data: entries,
    isLoading: entriesLoading,
    isError: entriesError,
  } = useQuery<Entry[]>({
    queryFn: async () => (await client.get(`sites/${siteId}/entries/`)).data,
    queryKey: [siteId, 'daybook'],
  });

  // Fetch heads
  const { data: heads, isLoading: headsLoading } = useQuery<Head[]>({
    queryFn: async () => (await client.get(`sites/${siteId}/heads/`)).data,
    queryKey: [siteId, 'heads'],
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: CreateEntryFormValues) => {
      await client.post(`sites/${siteId}/entries/`, {
        head: data.head,
        description: data.description,
        amountCr: data.amountCr,
        amountDb: data.amountDb,
      });
    },
    onSuccess: () => {
      toast.success('Entry created successfully');
      queryClient.invalidateQueries({ queryKey: [siteId, 'daybook'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to create entry.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await client.delete(`sites/${siteId}/entries/${entryId}/`);
    },
    onSuccess: () => {
      toast.success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: [siteId, 'daybook'] });
      setDeleteEntryId(null);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to delete entry.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  // Build a map of head id -> head name
  const headMap = useMemo(() => {
    const map = new Map<string, string>();
    heads?.forEach((h) => map.set(h.id, h.name));
    return map;
  }, [heads]);

  // Unique heads present in entries (for the filter dropdown)
  const entryHeads = useMemo(() => {
    const map = new Map<string, string>();
    entries?.forEach((e) => map.set(e.head, headMap.get(e.head) || 'Unknown'));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [entries, headMap]);

  // Filter entries by selected head and enrich with head name
  const rowData = useMemo<EntryRow[]>(() => {
    if (!entries) return [];
    const filtered =
      selectedHeadId === 'all'
        ? entries
        : entries.filter((e) => e.head === selectedHeadId);
    return filtered.map((e) => ({
      ...e,
      headName: headMap.get(e.head) || 'Unknown',
    }));
  }, [entries, selectedHeadId, headMap]);

  // Calculate totals
  const totals = useMemo(() => {
    return rowData.reduce(
      (acc, entry) => ({
        credit: acc.credit + parseFloat(entry.amountCr || '0'),
        debit: acc.debit + parseFloat(entry.amountDb || '0'),
      }),
      { credit: 0, debit: 0 }
    );
  }, [rowData]);

  // Build pinned bottom row
  const pinnedBottomRowData = useMemo<Partial<EntryRow>[]>(
    () => [
      {
        headName: 'Total',
        description: '',
        amountCr: formatNumber(totals.credit),
        amountDb: formatNumber(totals.debit),
        createdBy: `₹${formatNumber(totals.credit - totals.debit)}`,
      },
    ],
    [totals]
  );

  const editableHeads = useMemo(
    () => heads?.filter((head) => siteId === head.site && !head.isDeleted) ?? [],
    [heads]
  );

  const usableHeads = useMemo(() => heads?.filter((head) => !head.isDeleted), [heads]);

  // AG Grid column definitions
  const columnDefs: ColDef<EntryRow>[] = useMemo(
    () => [
      {
        headerName: 'Date',
        field: 'createdAt',
        sortable: true,
        filter: 'agDateColumnFilter',
        filterParams: {
          maxNumConditions: 1,
          filterOptions: ['equals', 'inRange'],
        },
        valueFormatter: ({ value }) => {
          if (!value) return '';
          return formatDate(value);
        },
      },
      {
        headerName: 'Head',
        field: 'headName',
        sortable: true,
        filter: 'agTextColumnFilter',
        filterParams: {
          maxNumConditions: 1,
          filterOptions: ['contains'],
        },
      },
      {
        headerName: 'Description',
        field: 'description',
        sortable: true,
        filter: 'agTextColumnFilter',
        filterParams: {
          maxNumConditions: 1,
          filterOptions: ['contains'],
        },
        flex: 2,
      },
      {
        headerName: 'Credit (₹)',
        field: 'amountCr',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: ({ value }) => {
          const num = parseFloat(value);
          return num > 0
            ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : '—';
        },
        cellClass: 'text-green-600 font-semibold text-right',
      },
      {
        headerName: 'Debit (₹)',
        field: 'amountDb',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: ({ value }) => {
          const num = parseFloat(value);
          return num > 0
            ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : '—';
        },
        cellClass: 'text-red-600 font-semibold text-right',
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        sortable: true,
        filter: 'agTextColumnFilter',
        filterParams: {
          maxNumConditions: 1,
          filterOptions: ['contains'],
        },
      },
      {
        headerName: 'Actions',
        field: 'id',
        sortable: false,
        filter: false,
        resizable: false,
        maxWidth: 90,
        cellRenderer: (params: ICellRendererParams<EntryRow>) => (
          <div className="flex items-center justify-center h-full">
            {!params.node.rowPinned && (
              <Button
                className="h-9 w-9 shrink-0 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-600 "
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (params.data?.id) setDeleteEntryId(params.data.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
      filterParams: {
        buttons: ['apply', 'reset'],
      },
    }),
    []
  );

  if (entriesError) {
    return <Navigate to="/sites" replace />;
  }

  if (entriesLoading || headsLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Daybook">
      <Tabs defaultValue="entries" className="flex flex-col flex-1 gap-10">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="heads">Manage Heads</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="flex flex-col gap-4 flex-1">
          {/* Toolbar */}
          <h2 className="text-xl font-semibold">Entries</h2>

          <div className="flex flex-row items-start sm:items-center justify-between gap-3">
            {/* Filter */}
            <Popover open={headFilterOpen} onOpenChange={setHeadFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={headFilterOpen}
                  className="w-48 justify-between font-normal"
                >
                  {selectedHeadId === 'all'
                    ? 'All Heads'
                    : headMap.get(selectedHeadId) || 'Select head...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0">
                <Command>
                  <CommandInput placeholder="Search heads..." />
                  <CommandList>
                    <CommandEmpty>No heads found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedHeadId('all');
                          setHeadFilterOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedHeadId === 'all' ? 'opacity-100' : 'opacity-0'}`}
                        />
                        All Heads
                      </CommandItem>
                      {entryHeads.map((head) => (
                        <CommandItem
                          key={head.id}
                          value={head.id}
                          keywords={[head.name]}
                          onSelect={() => {
                            setSelectedHeadId(head.id);
                            setHeadFilterOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedHeadId === head.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {head.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Actions */}
            <div className='flex flex-row gap-2'>
              <Button
                size="sm"
                onClick={handlePrint}
                variant="outline"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Entry</span>
              </Button>

            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500 font-medium">Total Credit</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                ₹
                {totals.credit.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500 font-medium">Total Debit</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                ₹
                {totals.debit.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 font-medium">Balance</p>
              <p
                className={`text-xl font-bold mt-1 ${totals.credit - totals.debit >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                  }`}
              >
                ₹
                {(totals.credit - totals.debit).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* AG Grid entries table */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="w-full h-[500px]">
              <AgGridReact<EntryRow>
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pinnedBottomRowData={pinnedBottomRowData}
                headerHeight={44}
                rowHeight={48}
                suppressMovableColumns
                suppressCellFocus
                suppressRowHoverHighlight
                noRowsOverlayComponent={() => (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No entries found.
                  </div>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heads">
          {heads && <ManageHeadsTab siteId={siteId!} heads={editableHeads} />}
        </TabsContent>
      </Tabs>

      {/* Create Entry Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Entry</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createEntryMutation.mutate(data)
              )}
              className="flex flex-col gap-4 mt-2"
            >
              <FormField
                control={form.control}
                name="head"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Head</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            {field.value
                              ? headMap.get(field.value) || 'Select a head'
                              : 'Select a head'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search heads..." />
                          <CommandList>
                            <CommandEmpty>No heads found.</CommandEmpty>
                            <CommandGroup>
                              {usableHeads?.map((head) => (
                                <CommandItem
                                  key={head.id}
                                  value={head.id}
                                  keywords={[head.name]}
                                  onSelect={() => {
                                    field.onChange(head.id);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${field.value === head.id ? 'opacity-100' : 'opacity-0'}`}
                                  />
                                  {head.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amountCr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountDb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debit (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Dialog */}
      <DeleteDialog
        open={!!deleteEntryId}
        description="Are you sure you want to delete this entry? This action cannot be undone."
        onOpenChange={(open) => {
          if (!open) setDeleteEntryId(null);
        }}
        loading={deleteEntryMutation.isPending}
        onDelete={() => {
          if (deleteEntryId) deleteEntryMutation.mutate(deleteEntryId);
        }}
      />
    </Scaffold>
  );
};
