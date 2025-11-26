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

import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import {
	findNodeHandle,
	type NativeSyntheticEvent,
	TextInput as RNTextInput,
	type TextInputProps as RNTextInputProps,
	type TextInputFocusEventData,
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
	inModal: boolean;
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
	inModal,
	...props
}: TextInputProps) => {
	const isFocused = useSharedValue(false);
	const isEmpty = useSharedValue(
		props.value === undefined || !props.value.length,
	);
	const animatedTheme = useAnimatedTheme();
	const springConfig = { damping: 100, stiffness: 500 };
	const { handleOnBlur, handleOnFocus } = inModal
		? useKeyboardFocusEvents()
		: { handleOnFocus: () => {}, handleOnBlur: () => {} };
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
						handleOnBlur(e);
						props.onBlur?.(e);
					}}
					onFocus={(e) => {
						isFocused.value = true;
						handleOnFocus(e);
						props.onFocus?.(e);
					}}
					style={[styles.input, style]}
				/>
			</Animated.View>
		</View>
	);
};

// https://gorhom.dev/react-native-bottom-sheet/keyboard-handling
//
// Code is from https://github.com/gorhom/react-native-bottom-sheet/blob/d12f3f7da19e5152fb541c4cfd36340cf5274473/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx#L28
const useKeyboardFocusEvents = () => {
	const { animatedKeyboardState, textInputNodesRef } =
		useBottomSheetInternal();

	const handleOnFocus = useCallback(
		(args: NativeSyntheticEvent<TextInputFocusEventData>) => {
			animatedKeyboardState.set((state) => ({
				...state,
				target: args.nativeEvent.target,
			}));
		},
		[animatedKeyboardState],
	) as NonNullable<TextInputProps["onFocus"]>;
	const handleOnBlur = useCallback(
		(args: NativeSyntheticEvent<TextInputFocusEventData>) => {
			const keyboardState = animatedKeyboardState.get();
			const currentFocusedInput = findNodeHandle(
				//@ts-expect-error
				RNTextInput.State.currentlyFocusedInput(),
			);

			/**
			 * we need to make sure that we only remove the target
			 * if the target belong to the current component and
			 * if the currently focused input is not in the targets set.
			 */
			const shouldRemoveCurrentTarget =
				keyboardState.target === args.nativeEvent.target;
			const shouldIgnoreBlurEvent =
				currentFocusedInput &&
				textInputNodesRef.current.has(currentFocusedInput);

			if (shouldRemoveCurrentTarget && !shouldIgnoreBlurEvent) {
				animatedKeyboardState.set((state) => ({
					...state,
					target: undefined,
				}));
			}
		},
		[animatedKeyboardState, textInputNodesRef],
	) as NonNullable<TextInputProps["onBlur"]>;
	return { handleOnBlur, handleOnFocus };
};
