import { Toast, Toaster, toast } from 'sonner';

export function NotificationService() {
  const notifySuccess = (message: string) => {
    toast.success(message);
  };

  const notifyError = (message: string) => {
    toast.error(message);
  };

  return (
    <>
      <Toaster />
    </>
  );
}