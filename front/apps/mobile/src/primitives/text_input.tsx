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
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";

type TextInputProps = RNTextInputProps;

const styles = StyleSheet.create((theme) => ({
	container: {
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.borderRadius,
		borderWidth: 2,
		backgroundColor: theme.colors.background,
		borderColor: theme.colors.text.primary,
		marginTop: theme.gap(2),
		// TODO Make sure it's responsive w/ adaptive fonts
		width: theme.fontSize.rem(20),
	},
	placeholder: {
		position: "absolute",
		paddingHorizontal: theme.gap(1),
		left: theme.gap(1.5),
		backgroundColor: theme.colors.background,
	},
	input: {
		color: theme.colors.text.primary,
	},
}));

export const TextInput = ({ placeholder, style, ...props }: TextInputProps) => {
	const isFocused = useSharedValue(false);
	const isEmpty = useSharedValue(true);
	const animatedTheme = useAnimatedTheme();

	const labelStyle = useAnimatedStyle(() => {
		const labelIsRaised = isFocused.value || !isEmpty.value;
		const springConfig = { damping: 100, stiffness: 500 };
		return {
			//TODO use theme.gap
			top: withSpring(labelIsRaised ? -14 : 16, springConfig),
			fontSize: 16,
			color: withSpring(
				labelIsRaised
					? animatedTheme.value.colors.text.primary
					: animatedTheme.value.colors.text.secondary,
				springConfig,
			),
			fontFamily: isFocused.value
				? animatedTheme.value.fontStyles.semiBold.fontFamily
				: animatedTheme.value.fontStyles.regular.fontFamily,
		};
	});

	const containerStyle = useAnimatedStyle(() => ({
		borderWidth: withSpring(isFocused.value ? 3 : 1, {
			damping: 100,
			stiffness: 500,
		}),
	}));
	return (
		<Animated.View style={[styles.container, containerStyle]}>
			<Animated.Text style={[styles.placeholder, labelStyle]}>
				{placeholder}
			</Animated.Text>
			<RNTextInput
				{...props}
				onChangeText={(t) => {
					isEmpty.value = t.length === 0;
				}}
				onBlur={() => {
					isFocused.value = false;
				}}
				onFocus={() => {
					isFocused.value = true;
				}}
				style={[styles.input, style]}
			/>
		</Animated.View>
	);
};
