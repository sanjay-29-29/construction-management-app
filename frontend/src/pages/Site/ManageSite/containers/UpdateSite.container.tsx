import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MultiSelect } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import type { Site } from '@/types';

export type UpdateSiteContainerProps = {
  site?: Site;
  isSiteUpdateDialogOpen: boolean;
  setSiteUpdateDialog: Dispatch<SetStateAction<boolean>>;
};

const updateSiteSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid name' }),
  address: z.string().min(1, { error: 'Please enter a valid address' }),
  supervisors: z.array(z.string()),
  isActive: z.boolean(),
});

type UpdateSiteFormValues = z.infer<typeof updateSiteSchema>;

export const UpdateSiteContainer = ({
  site,
  isSiteUpdateDialogOpen,
  setSiteUpdateDialog,
}: UpdateSiteContainerProps) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'supervisors'],
    queryFn: async () => {
      const response = await client.get<[]>('users/supervisors/');
      return response.data;
    },
    enabled: isSiteUpdateDialogOpen,
  });

  const form = useForm<UpdateSiteFormValues>({
    resolver: zodResolver(updateSiteSchema),
    defaultValues: {
      name: '',
      address: '',
      isActive: true,
      supervisors: [],
    },
  });

  useEffect(() => {
    if (site && isSiteUpdateDialogOpen) {
      form.reset({
        ...site,
        isActive: !site.isActive,
        supervisors: site.supervisors?.map((user) => user.id),
      });
    }
  }, [site, form, isSiteUpdateDialogOpen]);

  useEffect(() => {
    if (error) {
      toast.error('Error occurred while fetching supervisors.');
    }
  }, [error]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateSiteFormValues) => {
      await client.patch(`sites/${site?.id}/`, {
        ...data,
        isActive: !data.isActive,
      });
    },
    onSuccess: () => {
      setSiteUpdateDialog(false);
      toast.success('The site was updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['sites', site?.id],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while updating site.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  const onSubmit = (data: UpdateSiteFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isSiteUpdateDialogOpen} onOpenChange={setSiteUpdateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Site</DialogTitle>
          <DialogDescription>
            Make changes to site here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 mb-4">
              {/* Site Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Erode Site"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the name of the site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123 Industrial Way, Suite 100"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter address for the site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supervisors (MultiSelect) */}
              <FormField
                control={form.control}
                name="supervisors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={data ?? []}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        placeholder="Select supervisors"
                        modalPopover={true}
                        className="w-full h-10 padding-0"
                        disabled={mutation.isPending || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Assign one or more supervisors responsible for this site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Site Completed (Switch) */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="font-medium">
                        Site Completed
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Mark this site as finished.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={mutation.isPending}
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
            disabled={mutation.isPending}
            onClick={() => {
              setSiteUpdateDialog(false);
              form.clearErrors();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {mutation.isPending ? (
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
  );
};
