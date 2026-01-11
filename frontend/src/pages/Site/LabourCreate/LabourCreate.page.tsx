import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENDER_DROPDOWN, LABOUR_DROPDOWN } from '@/constants/role.constants';

const labourSchema = z.object({
  name: z.string().min(1, { error: 'Enter a valid first name.' }),
  previousBalance: z.coerce.number<number>().optional(),
  type: z.number(),
  gender: z.number(),
});

type CreateLabourFormValues = z.infer<typeof labourSchema>;

export const LabourCreate = () => {
  const { siteId } = useParams();
  const form = useForm<CreateLabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      name: '',
      previousBalance: 0,
      type: 1,
      gender: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateLabourFormValues) => {
      await client.post(`sites/${siteId}/labours/`, data);
    },
    onSuccess: () => {
      toast.success('The labour created successfully.');
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while creating labour.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const onSubmit = (data: CreateLabourFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Scaffold title="Create Labour">
      <div className="p-4 pb-20 bg-white flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-5 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter name of the labour</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Balance</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter previous balance for the labour
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LABOUR_DROPDOWN.map((val) => (
                          <SelectItem value={val.value} key={val.value}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select type of labour</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_DROPDOWN.map((val) => (
                          <SelectItem value={val.value} key={val.value}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select gender of labour</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t px-4 py-3">
              <Button className="w-full h-12 text-base font-medium">
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
