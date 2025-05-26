import toast from "react-hot-toast";

export const showNotification = {
  success: (message) => {
    toast.success(message, {
      id: `success-${Date.now()}`, // dibuat unique agar tidak terjadi duplikat karena toast dapat ditumpuk
    });

    console.log("MASOK");
  },
  error: (message) => {
    toast.error(message, {
      id: `error-${Date.now()}`,
    });
  },
  loading: (message) => {
    return toast.loading(message);
  },
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};
