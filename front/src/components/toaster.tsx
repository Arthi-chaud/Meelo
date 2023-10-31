import { useEffect } from 'react';
import * as Toasts from 'react-hot-toast';

// Wrapper around the base toaster
const Toaster = () => {
	const { toasts } = Toasts.useToasterStore();
	const TOAST_LIMIT = 2;

	useEffect(() => {
		toasts
			.filter((toast) => toast.visible)
			.filter((item, index) => index >= TOAST_LIMIT)
			.forEach((toast) => Toasts.toast.dismiss(toast.id));
	}, [toasts]);
	return <Toasts.Toaster toastOptions={{ duration: 2500 }} position='bottom-center' />;
};

export default Toaster;
