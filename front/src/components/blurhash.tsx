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

import { Box } from "@mui/material";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";
import { Blurhash as RBlurhash } from "react-blurhash";
import { ComponentProps, useEffect, useMemo, useState } from "react";

type BlurhashProps = ComponentProps<typeof Box> & {
	blurhash?: string;
};

const Blurhash = ({ blurhash, ...props }: BlurhashProps) => {
	const [isSSR, setIsSSr] = useState(true);
	const ssrProps = () => ({
		...props,
		sx: {
			backgroundImage: blurhash
				? `url(${blurHashToDataURL(blurhash)})`
				: "none",
			backgroundRepeat: "no-repeat",
			backgroundSize: "cover",
			...props.sx,
		},
	});
	const containerProps = useMemo(() => {
		if (isSSR) {
			return ssrProps();
		}
		return props;
	}, [isSSR]);

	useEffect(() => {
		setIsSSr(false);
	}, []);

	return (
		<Box suppressHydrationWarning {...containerProps}>
			{blurhash && (
				<RBlurhash
					hash={blurhash}
					style={{ width: "100%", height: "100%" }}
				/>
			)}
		</Box>
	);
};

export default Blurhash;
