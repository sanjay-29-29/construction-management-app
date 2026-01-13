import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, X } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { GENDER, GENDER_DROPDOWN } from '@/constants/role.constants';
import type { Labour } from '@/types';

const labourSchema = z.object({
  photo: z.instanceof(File).nullable().optional(),
  name: z.string().min(1, { error: 'Enter a valid first name.' }),
  gender: z.number(),
  aadharNumber: z.coerce.string<string>().optional(),
  bankAccountNumber: z.coerce.string<string>().optional(),
  ifscCode: z.string().optional(),
  branchName: z.string().optional(),
});

type UpdateLabourFormValues = z.infer<typeof labourSchema>;

export const UpdateLabourDialog = ({
  data,
  open,
  onOpenChange,
}: {
  data?: Labour;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) => {
  const { siteId, labourId } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateLabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      name: '',
      gender: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateLabourFormValues) => {
      const formData = new FormData();
      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      }
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'photo' || value === null || value === undefined) {
          return;
        }
        formData.append(key, String(value));
      });
      await client.patch(`sites/${siteId}/labours/${labourId}/`, formData);
    },
    onSuccess: () => {
      toast.success('The labour was updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
      onOpenChange(false);
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
        ...data,
        gender: data.gender == GENDER.MALE ? 1 : 2,
        photo: undefined,
      });
    }
  }, [data, open, form]);

  const photoValue = form.watch('photo');

  const photoPreviewUrl = useMemo(() => {
    if (photoValue instanceof File) {
      return URL.createObjectURL(photoValue);
    }
    if (data?.photo) {
      return data.photo;
    }
    return null;
  }, [photoValue, data?.photo]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const onSubmit = (data: UpdateLabourFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 relative">
                  <AvatarImage
                    src={photoPreviewUrl ?? undefined}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={undefined}
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          disabled={mutation.isPending}
                          onChange={(e) => {
                            field.onChange(e.target.files?.[0] ?? null);
                          }}
                          endContent={
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={mutation.isPending}
                              onClick={() => {
                                form.setValue('photo', undefined);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="shrink-0"
                            >
                              <X className="mr-1 h-4 w-4" />
                            </Button>
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Upload labour photo (JPG, PNG)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="aadharNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234 5678 9010"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter name aadhar number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="59510100003455"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter name bank account number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="BARB0MOOLAP"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter name bank account number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Branch Name"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter bank branch name</FormDescription>
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
              onOpenChange(false);
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
  );
};
