import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Building,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { LoaderPage } from '@/components/LoaderPage';
import { Scaffold } from '@/components/Scaffold';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ROLES, ROLES_DROPDOWN } from '@/constants/role.constants';
import { useAuth } from '@/context/Auth';
import type { User } from '@/types';

const updateUserSchema = z.object({
  firstName: z.string().min(1, { error: 'Enter a valid first name.' }),
  lastName: z.string().min(1, { error: 'Enter a valid last name.' }),
  email: z.email('Enter a valid email.'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().optional(),
  role: z.number().optional(),
  isActive: z.boolean(),
});

type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const ManageUserPage = () => {
  const { id } = useParams();
  const { isHeadOffice, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isUserUpdateDialogOpen, setUserUpdateDialog] =
    useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: currentUser,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await client.get<User>(`users/${id}/`);
      return response.data;
    },
  });

  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateUserFormValues) => {
      await client.patch(`users/${currentUser?.id}/`, {
        ...data,
        phone: `+91${data.phone}`,
      });
    },
    onSuccess: () => {
      setUserUpdateDialog(false);
      toast.success('The user was updated successfully.');
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      navigate('/users', { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Error occurred while updating user.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const onSubmit = (data: UpdateUserFormValues) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (isUserUpdateDialogOpen && currentUser) {
      form.reset({
        firstName: currentUser.firstName ?? '',
        lastName: currentUser.lastName ?? '',
        email: currentUser.email ?? '',
        phone: currentUser.phone.slice(3, currentUser.phone.length) ?? '',
        isActive: currentUser.isActive,
        role: currentUser.role === ROLES.HEAD_OFFICE ? 1 : 2,
      });
    }
  }, [isUserUpdateDialogOpen, currentUser, form]);

  if (isError) {
    return <Navigate to="/users" replace />;
  }

  if (!isError && isLoading) {
    return <LoaderPage />;
  }

  return (
    <Scaffold title="Manage User">
      <Card className="border-l-4 border-l-green-600 gap-0 shadow-none">
        {/* HEADER */}
        <CardHeader className="pb-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
                <CardTitle className="text-lg sm:text-xl truncate">
                  {`${currentUser?.firstName} ${currentUser?.lastName}`}
                </CardTitle>

                <Badge
                  className={`shrink-0 ${
                    currentUser?.isActive
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {currentUser?.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>

              <CardDescription className="mt-3 space-y-2 text-sm">
                {/* Role */}
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {currentUser?.role ?? '—'}
                  </span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {currentUser?.phone ?? '—'}
                  </span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">
                    {currentUser?.email ?? '—'}
                  </span>
                </div>
              </CardDescription>
            </div>
            {(isAdmin ||
              (isHeadOffice &&
                (currentUser?.role === ROLES.HEAD_OFFICE ||
                  currentUser?.role === ROLES.SITE_ENGINEER))) && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-300 hover:bg-gray-100"
                onClick={() => setUserUpdateDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      <Dialog open={isUserUpdateDialogOpen} onOpenChange={setUserUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Make changes to the user profile here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-5 mb-4">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter first name of the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter last name of the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter email address of the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter phone number"
                          {...field}
                          disabled={mutation.isPending}
                          // Note: ensure your custom Input component supports startContent
                          startContent="+91 "
                        />
                      </FormControl>
                      <FormDescription>
                        Enter phone number of the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
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
                            placeholder="Enter password"
                            {...field}
                            disabled={mutation.isPending}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter password for the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        defaultValue={String(field.value)}
                        disabled={mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLES_DROPDOWN.map((val) => (
                            <SelectItem value={val.value} key={val.value}>
                              {val.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select role for the user
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Account Enabled (Switch) */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Account Enabled
                        </FormLabel>
                        <FormDescription>
                          Allow this user to access the system.
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
              <DialogFooter>
                <Button
                  className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
                  variant="outline"
                  disabled={mutation.isPending}
                  type="button"
                  onClick={() => {
                    setUserUpdateDialog(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="outline" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Scaffold>
  );
};
