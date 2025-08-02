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
import { useEffect, useMemo, useState } from "react";
import { generateArray } from "@/utils/gen-list";
import { isSSR } from "~/utils/is-ssr";

const _colors = atom<string[] | null>(null);
const colorsAtom = atom(
	(get) => get(_colors),
	(_, set, newColors: string[] | null) => set(_colors, newColors),
);

export const useGradientBackground = (
	colors: string[] | null | undefined,
	index = 0,
) => {
	const [_colors, setColors] = useAtom(colorsAtom);
	const sortedColors = colors?.sort();

	useEffect(() => {
		if (
			colors &&
			colors.length >= 5 &&
			sortedColors?.toString() !== _colors?.toString()
		) {
			setColors(sortedColors ?? null);
		}
	}, [colors]);
	if (isSSR()) {
		// If SSR, we cannot set atoms.
		return {
			GradientBackground: () => (
				<GradientBackgroundComponent
					colors={colors?.sort() ?? null}
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
	// When Client-Side Rendering, we set CSS variables to the atom state
	// That way, we can setup a smooth transition
	const [colors] = useAtom(colorsAtom);
	const colorVars = useMemo(() => {
		return colors?.map((_, i) => `var(--gradientColor${i + 1})`) ?? null;
	}, [colors]);
	const style = useMemo(() => {
		return colors?.reduce((res, c, i) => {
			return {
				[`--gradientColor${i + 1}`]: c,
				...res,
			};
		}, {});
	}, [colors]);

	return (
		<Box sx={style}>
			<GradientBackgroundComponent colors={colorVars} />
		</Box>
	);
};

// Core Component

type GradientBackgroundProps = {
	colors: string[] | null;
	index?: number;
};

const computeGradient = (colors: string[]) => {
	const [color1, color2, color3, color4, color5] = colors;
	return `
		radial-gradient(ellipse at 10% 90%, ${color1} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 90%, ${color2} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 10%, ${color3} 0%, transparent 55%),
		radial-gradient(ellipse at 10% 10%, ${color4} 0%, transparent 55%),
		radial-gradient(ellipse at 0% 100%, ${color5} 0%, transparent 55%)`;
};

const GradientBackgroundComponent = ({
	colors,
	index,
}: GradientBackgroundProps) => {
	const theme = useTheme();
	const [transition, setTransition] = useState("");

	useEffect(() => {
		// Ok so we cant have the transition set at all times because at hydration, the atom/colors will be null,
		// leading to a flash from SSR gradient, to no background, to CSR/atom gradient
		// We set transition 'after' the colors have been passed to the CSS
		// to avoid that flash
		if (colors && !transition) {
			setTransition(
				[1, 2, 3, 4, 5]
					.map((i) => `--gradientColor${i} .3s`)
					.join(", "),
			);
		}
	}, [colors]);
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
				transition,
				background: computeGradient(colors ?? generateArray(5)),
			}}
		/>
	);
};
