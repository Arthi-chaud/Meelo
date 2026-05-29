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

import { DeviceType, deviceType } from "expo-device";
import { Pressable } from "react-native";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { StyleSheet } from "react-native-unistyles";
import { CheckIcon, ErrorIcon } from "@/ui/icons";
import { Text } from "~/primitives/text";

type ToastProps = { text: string };

export const showSuccessToast = (t: ToastProps) => {
	Toast.hide();
	Toast.show({ type: "success", text1: t.text });
};
export const showErrorToast = (t: ToastProps) => {
	Toast.hide();
	Toast.show({ type: "error", text1: t.text });
};

type ToastComponentProps = { text: string; variant: "success" | "error" };

export const ToastComponent = ({ text, variant }: ToastComponentProps) => {
	const Icon = variant === "success" ? CheckIcon : ErrorIcon;
	styles.useVariants({ variant, isTablet: deviceType === DeviceType.TABLET });
	return (
		<Pressable style={styles.root} onPress={() => Toast.hide()}>
			<Icon variant="Bold" style={styles.icon} />
			<Text variant="thirdTitle" style={styles.text}>
				{text}
			</Text>
		</Pressable>
	);
};

const toastConfig: ToastConfig = {
	success: ({ text1 }) => (
		<ToastComponent text={text1 ?? ""} variant="success" />
	),
	error: ({ text1 }) => <ToastComponent text={text1 ?? ""} variant="error" />,
};

export const ToastManager = () => {
	return <Toast config={toastConfig} />;
};

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		variants: {
			isTablet: {
				true: {
					alignSelf: "flex-end",
					marginRight: theme.gap(2),
				},
				false: {},
			},
		},
		maxWidth: rt.screen.width * 0.9,
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius * 1.5,
		padding: theme.gap(2),
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(1.5),
		elevation: 10,
	},
	icon: {
		variants: {
			variant: {
				success: { color: theme.colors.success },
				error: { color: theme.colors.error },
			},
		},
	},
	text: {
		flex: deviceType === DeviceType.PHONE ? 1 : undefined,
	},
}));
