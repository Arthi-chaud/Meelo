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

import { Box, Skeleton, Typography } from "@mui/material";

type SectionHeaderProps<T> = {
	heading: string | JSX.Element | undefined;
	trailing?: JSX.Element;
};

/**
 * A scrollable row (possibly of tiles) with a header with a 'more' button
 */
const SectionHeader = <T,>(props: SectionHeaderProps<T>) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexGrow: 1,
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<Typography variant="h5" fontWeight="bold">
				{props.heading ?? <Skeleton width={"200px"} />}
			</Typography>
			{props.trailing}
		</Box>
	);
};

export default SectionHeader;
