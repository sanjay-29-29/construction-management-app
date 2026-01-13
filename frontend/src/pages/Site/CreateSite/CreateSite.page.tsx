import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
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

const createSiteSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid name' }),
  address: z.string().min(1, { error: 'Please enter a valid address' }),
  supervisors: z.array(z.string()),
});

type CreateSiteFormValues = z.infer<typeof createSiteSchema>;

export const CreateSitePage = () => {
  const form = useForm<CreateSiteFormValues>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: '',
      address: '',
      supervisors: [],
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'supervisors'],
    queryFn: async () => {
      const response = await client.get<[]>('users/supervisors/');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateSiteFormValues) => {
      await client.post('sites/', data);
    },
    onSuccess: () => {
      toast.success('Site created successfully.');
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while creating site.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const onSubmit = (data: CreateSiteFormValues) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (error) {
      toast.error('Error', {
        description: 'Error occurred while fetching supervisors.',
      });
    }
  }, [error]);

  return (
    <Scaffold title="Create Site" disablePadding>
      <div className="p-4 pb-24 bg-white flex-1 lg:m-8 lg:rounded-md lg:flex-initial lg:p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
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
                  <FormDescription>Enter name of the site.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 123, Street Name, Area, City"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter address for the site.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      placeholder="Select supervisors for this site"
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
