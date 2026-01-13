import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, X } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Scaffold } from '@/components/Scaffold';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  photo: z.instanceof(File).nullable().optional(),
  name: z.string().min(1, { error: 'Enter a valid name.' }),
  previousBalance: z.coerce.number<number>().optional(),
  aadharNumber: z.coerce
    .string<string>()
    .min(12, { error: 'Enter a valid aadhar number.' })
    .max(12, { error: 'Enter a valid aadhar number.' })
    .optional(),
  bankAccountNumber: z.coerce
    .string<string>()
    .min(5, { error: 'Enter a valid bank account number.' })
    .optional(),
  ifscCode: z.string().min(3, { error: 'Enter a valid IFSC Code.' }).optional(),
  branchName: z
    .string()
    .min(1, { error: 'Enter a valid branch name.' })
    .optional(),
  type: z.number(),
  gender: z.number(),
});

type CreateLabourFormValues = z.infer<typeof labourSchema>;

export const LabourCreate = () => {
  const { siteId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      await client.post(`sites/${siteId}/labours/`, formData);
    },
    onSuccess: () => {
      toast.success('The labour created successfully.');
      fileInputRef.current = null;
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

  const photo = form.watch('photo');
  const photoPreviewUrl =
    photo instanceof File ? URL.createObjectURL(photo) : null;

  return (
    <Scaffold title="Create Labour" disablePadding>
      <div className="p-4 pb-20 bg-white flex-1 lg:flex-initial lg:m-8 lg:p-4 lg:rounded-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <div className="grid grid-cols-2 gap-5">
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
            </div>
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
