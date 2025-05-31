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

import { Text as RNText, type TextProps } from "react-native";
import type { RequireExactlyOne } from "type-fest";

type TextVariant =
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "body"
	| "subtitle";

export const getTextStyle = (variant: TextVariant): string => {
	switch (variant) {
		case "h1":
			return "font-rubik-light text-5xl";
		case "h2":
			return "font-rubik-light text-4xl";
		case "h3":
			return "font-rubik-regular text-3xl";
		case "h4":
			return "font-rubik-regular text-2xl";
		case "h5":
			return "font-rubik-regular text-xl";
		case "h6":
			return "font-rubik-medium text-lg";
		case "body":
			return "font-rubik-regular text-base";
		case "subtitle":
			return "font-rubik-medium";
		default:
			return "font-rubik";
	}
};

/* Primitive for any text
 * DO NOT USE the style props to set the font weight.
 * Use the font family class names instead
 */
export const Text = ({
	children,
	content,
	variant,
	...props
}: Omit<TextProps, "children"> & {
	variant: TextVariant;
} & RequireExactlyOne<{ content: string } & Pick<TextProps, "children">>) => (
	<RNText
		{...props}
		className={`text-primary-light dark:text-primary-dark ${getTextStyle(variant)} ${props.className}`}
	>
		{content ?? children}
	</RNText>
);
