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

import { ErrorIcon } from "@/ui/icons";
import {
	TextInput as RNTextInput,
	type TextInputProps as RNTextInputProps,
	View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";

type TextInputProps = RNTextInputProps & { error?: string };

const styles = StyleSheet.create((theme) => ({
	container: {
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.borderRadius,
		borderWidth: 2,
		backgroundColor: theme.colors.background,
		variants: {
			error: {
				true: { borderColor: theme.colors.error },
				default: {
					borderColor: theme.colors.text.primary,
				},
			},
		},
		marginTop: theme.gap(1),
		// TODO Make sure it's responsive w/ adaptive fonts
		width: theme.fontSize.rem(20),
	},
	placeholder: {
		position: "absolute",
		paddingHorizontal: theme.gap(1),
		left: theme.gap(1.5),
		backgroundColor: theme.colors.background,
		variants: {
			error: {
				true: { color: theme.colors.error },
				false: {
					color: theme.colors.text.primary,
				},
			},
		},
	},
	input: {
		variants: {
			error: {
				true: { color: theme.colors.error },
				false: { color: theme.colors.text.primary },
			},
		},
	},
	errorContainer: {
		display: "flex",
		flexDirection: "row",
		gap: theme.gap(0.5),
		alignItems: "center",
		paddingLeft: theme.gap(1),
	},
	errorMessage: {
		color: theme.colors.error,
		fontFamily: theme.fontStyles.light.fontFamily,
	},
	errorIcon: {
		color: theme.colors.error,
	},
}));

export const TextInput = ({
	placeholder,
	style,
	error,
	...props
}: TextInputProps) => {
	const isFocused = useSharedValue(false);
	const isEmpty = useSharedValue(true);
	const animatedTheme = useAnimatedTheme();

	const labelStyle = useAnimatedStyle(() => {
		const labelIsRaised = isFocused.value || !isEmpty.value;
		const springConfig = { damping: 100, stiffness: 500 };
		return {
			//TODO use theme.gap
			top: withSpring(labelIsRaised ? -14 : 16, springConfig),
			fontSize: animatedTheme.value.fontSize.default,
			color: withSpring(
				error?.length
					? animatedTheme.value.colors.error
					: labelIsRaised
						? animatedTheme.value.colors.text.primary
						: animatedTheme.value.colors.text.secondary,
				springConfig,
			),
			fontFamily: isFocused.value
				? animatedTheme.value.fontStyles.semiBold.fontFamily
				: animatedTheme.value.fontStyles.regular.fontFamily,
		};
	}, [error]);

	const containerStyle = useAnimatedStyle(() => ({
		borderWidth: withSpring(isFocused.value ? 3 : 1, {
			damping: 100,
			stiffness: 500,
		}),
	}));
	styles.useVariants({ error: !!error });
	return (
		<View>
			<Animated.View style={[styles.container, containerStyle]}>
				<Animated.Text style={[styles.placeholder, labelStyle]}>
					{placeholder}
				</Animated.Text>
				<RNTextInput
					{...props}
					onChangeText={(t) => {
						isEmpty.value = t.length === 0;
						props.onChangeText?.(t);
					}}
					onBlur={(e) => {
						isFocused.value = false;
						props.onBlur?.(e);
					}}
					onFocus={(e) => {
						isFocused.value = true;
						props.onFocus?.(e);
					}}
					style={[styles.input, style]}
				/>
			</Animated.View>

			{error && (
				<View style={styles.errorContainer}>
					<ErrorIcon size={16} style={styles.errorIcon} />
					<Animated.Text style={[styles.errorMessage]}>
						{error}
					</Animated.Text>
				</View>
			)}
		</View>
	);
};
