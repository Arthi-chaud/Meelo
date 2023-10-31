
import { useMediaQuery, useTheme } from '@mui/material';
import hexToRgba from 'hex-to-rgba';
import { useEffect } from 'react';
import * as Toasts from 'react-hot-toast';

// Wrapper around the base toaster
const Toaster = () => {
	const { toasts } = Toasts.useToasterStore();
	const TOAST_LIMIT = 2;
	const theme = useTheme();
	const themePaperColor = hexToRgba(theme.palette.background.paper, 0.90);
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.down('md'));

	useEffect(() => {
		toasts
			.filter((toast) => toast.visible)
			.filter((item, index) => index >= TOAST_LIMIT)
			.forEach((toast) => Toasts.toast.dismiss(toast.id));
	}, [toasts]);
	return <Toasts.Toaster
		toastOptions={{ duration: 2500, style: {
			borderRadius: theme.shape.borderRadius,
			backgroundColor: themePaperColor,
			color: theme.palette.text.primary,
		} }}
		position={viewPortIsSmall ? 'top-center' : 'top-right'}
	/>;
};

export default Toaster;
