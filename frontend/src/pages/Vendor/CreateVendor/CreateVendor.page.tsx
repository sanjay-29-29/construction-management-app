import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

const createVendorSchema = z.object({
  name: z.string().min(1, { error: 'Please enter a valid name' }),
  address: z.string().min(1, { error: 'Please enter a valid address' }),
  notes: z.string().optional(),
});

type CreateVendorFormValues = z.infer<typeof createVendorSchema>;

export const CreateVendorPage = () => {
  const form = useForm<CreateVendorFormValues>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateVendorFormValues) => {
      try {
        await client.post('vendors/', data);
        toast.success('Vendor created sucessfully.');
        form.reset();
      } catch (error) {
        if (isAxiosError(error)) {
          toast.error('Error occurred while creating vendor.');
          return;
        }
        toast.error('Unknown error occurred.');
      }
    },
  });

  const onSubmit = (data: CreateVendorFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Scaffold title="Create Vendor" disablePadding>
      <div className="p-4 pb-24 flex-1 bg-white lg:m-8 lg:rounded-md lg:flex-initial lg:p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Steel Vendor"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>Enter name of the vendor</FormDescription>
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
                      {...field}
                      placeholder="123, Street Name, Area, City"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>Enter address of the vendor</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add internal references..."
                      className="resize-none"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>Enter notes of the vendor</FormDescription>
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
