import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { client } from '@/axios';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const createWeekSchema = z.object({
  startDate: z.date('A start date is required.'),
});

type CreateWeekFormData = z.infer<typeof createWeekSchema>;

export const CreateWeekDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();
  const { siteId } = useParams();

  const form = useForm<CreateWeekFormData>({
    resolver: zodResolver(createWeekSchema),
    defaultValues: {},
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateWeekFormData) => {
      await client.post(`sites/${siteId}/weeks/`, {
        startDate: format(data.startDate, 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'weeks'] });
      toast.success('Week schedule created successfully');
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Error creating week.');
        return;
      }
      toast.error('Unknown error occurred');
    },
  });

  const onSubmit = (data: CreateWeekFormData) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create New Week</DialogTitle>
          <DialogDescription>
            Select the start date (Saturday) to initialize a new weekly
            schedule. Labours can be assigned after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date.getDay() !== 6} // Disable non-Saturdays
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Week must start on a Saturday.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Schedule'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
