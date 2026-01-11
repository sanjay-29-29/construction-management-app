import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Button } from '@/components/ui/button';
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GENDER,
  GENDER_DROPDOWN,
  LABOUR_ROLES,
} from '@/constants/role.constants';
import type { Labour } from '@/types';

import { LabourCard } from '../LabourHome/containers/LabourCard.component';
import { RateWorkContainer } from '../LabourHome/containers/RateWorkContainer.container';

const labourSchema = z.object({
  name: z.string().min(1, { error: 'Enter a valid first name.' }),
  gender: z.number(),
});

type UpdateLabourFormValues = z.infer<typeof labourSchema>;

export const ManageLabour = () => {
  const { siteId, labourId } = useParams();

  const form = useForm<UpdateLabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      name: '',
      gender: 1,
    },
  });

  const [isLabourUpdateDialogOpen, setLabourUpdateDialog] =
    useState<boolean>(false);

  const { data, isError, isLoading } = useQuery({
    queryFn: async () => {
      const response = await client.get<Labour>(
        `sites/${siteId}/labours/${labourId}/`
      );
      return response.data;
    },
    queryKey: ['sites', siteId, 'labours', labourId],
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateLabourFormValues) => {
      await client.patch(`sites/${siteId}/labours/${labourId}/`, data);
    },
    onSuccess: () => {
      toast.success('The labour was updated successfully.');
      setLabourUpdateDialog(false);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while updating labour.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        gender: data.gender == GENDER.MALE ? 1 : 2,
      });
    }
  }, [data, isLabourUpdateDialogOpen, form]);

  const onSubmit = (data: UpdateLabourFormValues) => {
    mutation.mutate(data);
  };

  if (isError) {
    return <Navigate to="/sites" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage Labour">
      <div className="p-4 flex flex-col gap-10">
        <LabourCard data={data} setLabourUpdateDialog={setLabourUpdateDialog} />
        {data?.type === LABOUR_ROLES.RATE_WORKER && <RateWorkContainer />}
      </div>
      <Dialog
        open={isLabourUpdateDialogOpen}
        onOpenChange={setLabourUpdateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Labour</DialogTitle>
            <DialogDescription>
              Make changes to the labour here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter name of the labour
                      </FormDescription>
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
            </form>
          </Form>
          <DialogFooter>
            <Button
              className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                setLabourUpdateDialog(false);
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Scaffold>
  );
};
