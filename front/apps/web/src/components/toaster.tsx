/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
			.filter((_, index) => index >= TOAST_LIMIT)
			.forEach((toast) => {
				Toasts.toast.dismiss(toast.id);
			});
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
