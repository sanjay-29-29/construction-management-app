import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLES_DROPDOWN } from '@/constants/role.constants';

const userSchema = z.object({
  firstName: z.string().min(1, { error: 'Enter a valid first name.' }),
  lastName: z.string().min(1, { error: 'Enter a valid last name.' }),
  email: z.email('Enter a valid email.'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, { error: 'Enter a valid password' }),
  role: z.number(),
});

type CreateUserFormValues = z.infer<typeof userSchema>;

export const CreateUserPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 2,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateUserFormValues) => {
      await client.post('users/', {
        ...data,
        phone: `+91${data.phone}`,
      });
    },
    onSuccess: () => {
      form.reset();
      toast.success('The user created successfully.');
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error', {
          description: 'Error occurred while creating user.',
        });
        return;
      }
      toast.error('Error', {
        description: 'Unknown error occurred.',
      });
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Scaffold title="Create User">
      <div className="p-4 pb-20 bg-white flex-1">
        <Form {...form}>
          <form>
            <div className="grid gap-5 mb-4">
              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          disabled={mutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter first name of the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          disabled={mutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter last name of the user
                      </FormDescription>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter email address of the user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          +91
                        </span>
                        <Input
                          type="number"
                          className="pl-12"
                          placeholder="9876543210"
                          disabled={mutation.isPending}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter phone number of the user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password with Visibility Toggle */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          disabled={mutation.isPending}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter password for the user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
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
                        <SelectGroup>
                          {ROLES_DROPDOWN.map((val) => (
                            <SelectItem value={val.value} key={val.value}>
                              {val.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select role for the user</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t px-4 py-3">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="w-full h-12 text-base font-medium"
        >
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
    </Scaffold>
  );
};
