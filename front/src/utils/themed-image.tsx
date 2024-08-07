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

/* eslint-disable jsx-a11y/alt-text */

import { Box, useTheme } from "@mui/material";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { ComponentProps } from "react";

type ThemedImageProps = Record<"light" | "dark", string | StaticImport> &
	Omit<ComponentProps<typeof Image>, "src">;
const ThemedImage = ({ light, dark, ...props }: ThemedImageProps) => {
	const theme = useTheme();
	return (
		<>
			<Box
				sx={{
					display: "block",
					[theme.getColorSchemeSelector("dark")]: {
						display: "none",
					},
				}}
			>
				<Image src={light} {...props} />
			</Box>
			<Box
				sx={{
					display: "none",
					[theme.getColorSchemeSelector("dark")]: {
						display: "block",
					},
				}}
			>
				<Image src={dark} {...props} />
			</Box>
		</>
	);
};

export default ThemedImage;
