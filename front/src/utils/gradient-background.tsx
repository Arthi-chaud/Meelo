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

import { Box, useTheme } from "@mui/material";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { generateArray } from "./gen-list";
import { isSSR } from "./is-ssr";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";

const _colors = atom<string[] | null>(null);
const colorsAtom = atom(
	(get) => get(_colors),
	(_, set, newColors: string[] | null) => set(_colors, newColors),
);

const gradientCSS = atom((get) => {
	return computeGradient(get(colorsAtom) ?? generateArray(5));
});

const computeGradient = (colors: string[]) => {
	const [color1, color2, color3, color4, color5] = Array.of(...colors).sort();
	return `
		radial-gradient(ellipse at 10% 90%, ${color1} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 90%, ${color2} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 10%, ${color3} 0%, transparent 55%),
		radial-gradient(ellipse at 10% 10%, ${color4} 0%, transparent 55%),
		radial-gradient(ellipse at 0% 100%, ${color5} 0%, transparent 55%)`;
};

export const useGradientBackground = (colors?: string[], index = 0) => {
	const [_, setColors] = useAtom(colorsAtom);

	useEffect(() => {
		if (colors && colors.length >= 5) {
			setColors(colors ?? null);
		}
	}, [colors]);
	if (isSSR()) {
		// If SSR, we cannot set atoms.
		return {
			GradientBackground: () => (
				<GradientBackgroundComponent
					gradient={computeGradient(colors ?? generateArray(5))}
					index={index}
				/>
			),
		};
	}
	// We still return a component to avoid SSR errors/warning
	return {
		GradientBackground: () => <Box suppressHydrationWarning />,
	};
};

export const RootGradientBackground = () => {
	const [gradient] = useAtom(gradientCSS);

	return <GradientBackgroundComponent gradient={gradient} />;
};

// Core Component

type GradientBackgroundProps = {
	gradient?: string;
	index?: number;
};

const GradientBackgroundComponent = ({
	gradient,
	index,
}: GradientBackgroundProps) => {
	const theme = useTheme();

	return (
		<Box
			suppressHydrationWarning
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				zIndex: -10000 + (index ?? 0),
				width: "100dvw",
				height: "100dvh",
				opacity: 0.5,
				[theme.getColorSchemeSelector("dark")]: {
					opacity: 0.4,
				},
			}}
			style={{
				transition: "opacity .4s ease-in",
				background: gradient,
			}}
		/>
	);
};
