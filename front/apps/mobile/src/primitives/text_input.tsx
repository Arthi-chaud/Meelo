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

import {
	TextInput as RNTextInput,
	type TextInputProps as RNTextInputProps,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";

type TextInputProps = RNTextInputProps & {
	error?: string;
	containerStyle?: ViewStyle;
};

const styles = StyleSheet.create((theme) => ({
	root: {
		marginTop: theme.gap(1),
	},
	container: {
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.borderRadius,
		borderWidth: 2,
		variants: {
			error: {
				true: { borderColor: theme.colors.error },
				false: { borderColor: theme.colors.text.primary },
			},
		},
		// TODO Make sure it's responsive w/ adaptive fonts
		width: theme.fontSize.rem(20),
	},
	label: {
		paddingHorizontal: theme.gap(1),
		variants: {
			error: {
				true: { color: theme.colors.error },
				false: {
					color: theme.colors.text.primary,
				},
			},
		},
	},
	placeholder: {
		marginLeft: theme.gap(1),
		position: "absolute",
		marginTop: theme.gap(2),
	},
	input: {
		variants: {
			error: {
				true: { color: theme.colors.error },
				false: {
					color: theme.colors.text.primary,
				},
			},
		},
	},
}));

export const TextInput = ({
	placeholder,
	style,
	error,
	containerStyle,
	...props
}: TextInputProps) => {
	const isFocused = useSharedValue(false);
	const isEmpty = useSharedValue(
		props.value === undefined || !props.value.length,
	);
	const animatedTheme = useAnimatedTheme();
	const springConfig = { damping: 100, stiffness: 500 };

	const innerlabelStyle = useAnimatedStyle(() => {
		const labelIsRaised = isFocused.value || !isEmpty.value;
		return {
			opacity: withSpring(labelIsRaised ? 0 : 1, springConfig),
			fontSize: 16,
			color: withSpring(
				error
					? animatedTheme.value.colors.error
					: animatedTheme.value.colors.text.secondary,
				springConfig,
			),
		};
	}, [error, animatedTheme]);
	const topLabelStyle = useAnimatedStyle(() => {
		const labelIsRaised = isFocused.value || !isEmpty.value;
		return {
			opacity: withSpring(labelIsRaised ? 1 : 0, springConfig),
			fontSize: 16,
			color: withSpring(
				error
					? animatedTheme.value.colors.error
					: animatedTheme.value.colors.text.primary,
				springConfig,
			),
			fontFamily: isFocused.value
				? animatedTheme.value.fontStyles.semiBold.fontFamily
				: animatedTheme.value.fontStyles.regular.fontFamily,
		};
	});

	const animatedContainerStyle = useAnimatedStyle(() => ({
		borderWidth: withSpring(isFocused.value ? 3 : 1, springConfig),
	}));
	styles.useVariants({ error: !!error });
	return (
		<View>
			{(error || placeholder) && (
				<Animated.Text
					style={[styles.label, topLabelStyle]}
					numberOfLines={1}
				>
					{error || placeholder}
				</Animated.Text>
			)}
			<Animated.View
				style={[
					styles.container,
					animatedContainerStyle,
					containerStyle,
				]}
			>
				{(error || placeholder) && (
					<Animated.Text
						style={[
							styles.label,
							styles.placeholder,
							innerlabelStyle,
						]}
						numberOfLines={1}
					>
						{error || placeholder}
					</Animated.Text>
				)}
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
		</View>
	);
};
