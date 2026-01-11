import { Preferences } from '@capacitor/preferences';
import { PushNotifications, type Token } from '@capacitor/push-notifications';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/Auth';

const loginSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValue, setTokenValue] = useState<string>();
  const { setIsAuth, isAuth } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  PushNotifications.addListener('registration', (token: Token) => {
    setTokenValue(token.value);
  });

  const loginUser = async (data: LoginFormValues) => {
    try {
      const response = await client.post('login/', {
        ...data,
        fcm_token: tokenValue,
      });
      await Preferences.set({
        key: 'token',
        value: response.data.token,
      });
      setIsAuth(true);
      toast.success('Login Successful');
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);
        toast.error(
          error.response?.data?.nonFieldErrors?.[0] || 'Login failed'
        );
      } else {
        toast.error('Unknown Error Occurred');
      }
    }
  };

  const mutation = useMutation({
    mutationFn: loginUser,
  });

  const onSubmit = (data: LoginFormValues) => {
    mutation.mutate(data);
  };

  if (isAuth) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-dvh w-full bg-background flex flex-col">
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-8 pb-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to continue to the app.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    {/* Increased height (h-12) for better touch targets */}
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={mutation.isPending}
                      endContent={
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPassword((val) => !val);
                          }}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
