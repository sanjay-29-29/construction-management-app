import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { DeleteDialog } from '@/components/DeleteDialog';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Head } from '@/types';
import { useAuth } from '@/context/Auth';
import { Switch } from '@/components/ui/switch';

const headSchema = z.object({
  name: z.string().min(1, 'Please enter a head name'),
  isCommon: z.boolean(),
});

type HeadFormValues = z.infer<typeof headSchema>;

export const ManageHeadsTab = ({
  siteId,
  heads,
}: {
  siteId: string;
  heads: Head[];
}) => {
  const queryClient = useQueryClient();
  const { isHeadOffice } = useAuth();

  // Dialog state for create/update
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<Head | null>(null);

  // Delete state
  const [deleteHead, setDeleteHead] = useState<Head | null>(null);

  const form = useForm<HeadFormValues>({
    resolver: zodResolver(headSchema),
    defaultValues: {
      name: '',
      isCommon: false,
    },
  });

  const openCreateDialog = () => {
    setEditingHead(null);
    form.reset({ name: '', isCommon: false });
    setIsDialogOpen(true);
  };

  const openEditDialog = (head: Head) => {
    setEditingHead(head);
    form.reset({ name: head.name, isCommon: head.isCommon });
    setIsDialogOpen(true);
  };

  const createHeadMutation = useMutation({
    mutationFn: async (data: HeadFormValues) => {
      await client.post(`sites/${siteId}/heads/`, {
        name: data.name,
        isCommon: data.isCommon,
      });
    },
    onSuccess: () => {
      toast.success('Head created successfully');
      queryClient.invalidateQueries({ queryKey: [siteId, 'heads'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to create head.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const updateHeadMutation = useMutation({
    mutationFn: async (data: HeadFormValues) => {
      await client.patch(`sites/${siteId}/heads/${editingHead!.id}/`, {
        name: data.name,
        isCommon: data.isCommon,
      });
    },
    onSuccess: () => {
      toast.success('Head updated successfully');
      queryClient.invalidateQueries({ queryKey: [siteId, 'heads'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to update head.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const deleteHeadMutation = useMutation({
    mutationFn: async (headId: string) => {
      await client.delete(`sites/${siteId}/heads/${headId}/`);
    },
    onSuccess: () => {
      toast.success('Head deleted successfully');
      queryClient.invalidateQueries({ queryKey: [siteId, 'heads'] });
      queryClient.invalidateQueries({ queryKey: [siteId, 'daybook'] });
      setDeleteHead(null);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to delete head.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const onSubmit = (data: HeadFormValues) => {
    if (editingHead) {
      updateHeadMutation.mutate(data);
    } else {
      createHeadMutation.mutate(data);
    }
  };

  const isSaving = createHeadMutation.isPending || updateHeadMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Heads</h2>
        <Button size="sm" onClick={openCreateDialog} variant="outline">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Head</span>
        </Button>
      </div>

      {/* Heads list */}
      {heads.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          No heads found. Create one to get started.
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {heads.map((head) => (
            <div
              key={head.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">
                  {head.name}
                </span>
                {head.isCommon && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Common
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => openEditDialog(head)}
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteHead(head)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHead ? 'Update Head' : 'Create Head'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4 mt-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter head name"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isHeadOffice && (
                <FormField
                  control={form.control}
                  name="isCommon"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Common Head</FormLabel>
                        <FormDescription>
                          Allow the head to be accessed by all sites{' '}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingHead ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingHead ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteHead}
        description={`Are you sure you want to delete "${deleteHead?.name}"? This action cannot be undone.`}
        onOpenChange={(open) => {
          if (!open) setDeleteHead(null);
        }}
        loading={deleteHeadMutation.isPending}
        onDelete={() => {
          if (deleteHead) deleteHeadMutation.mutate(deleteHead.id);
        }}
      />
    </div>
  );
};
