import { toast } from 'react-toastify';

export const showSuccessNotification = (message: string) => {
  toast.success(message);
};

export const showErrorNotification = (message: string) => {
  toast.error(message);
};