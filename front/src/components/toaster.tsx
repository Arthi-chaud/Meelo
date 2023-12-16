import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import * as Toasts from "react-hot-toast";

// Wrapper around the base toaster
const Toaster = () => {
	const { toasts } = Toasts.useToasterStore();
	const TOAST_LIMIT = 2;
	const theme = useTheme();
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.down("md"));

	useEffect(() => {
		toasts
			.filter((toast) => toast.visible)
			.filter((item, index) => index >= TOAST_LIMIT)
			.forEach((toast) => Toasts.toast.dismiss(toast.id));
	}, [toasts]);
	return (
		<Toasts.Toaster
			toastOptions={{
				duration: 2500,
				style: {
					borderRadius: theme.shape.borderRadius,
					backgroundColor: theme.palette.background.paper,
					color: theme.palette.text.primary,
					boxShadow: "0 3px 10px rgba(0, 0, 0, 0.4)",
				},
			}}
			position={viewPortIsSmall ? "top-center" : "top-right"}
		/>
	);
};

export default Toaster;
