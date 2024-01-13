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
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

type ThemedImageProps = Record<"light" | "dark", string | StaticImport> &
	Omit<Parameters<typeof Image>[0], "src">;
const ThemedImage = (props: ThemedImageProps) => {
	const theme = useTheme();
	return (
		<>
			{(
				[
					["light", props.dark],
					["dark", props.light],
				] as const
			).map(([themeToHideImage, url]) => (
				<Box
					key={"image-" + themeToHideImage}
					sx={{
						display: "block",
						[theme.getColorSchemeSelector(themeToHideImage)]: {
							display: "none",
						},
					}}
				>
					<Image src={url} {...props} />
				</Box>
			))}
		</>
	);
};

export default ThemedImage;
