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

import { Box, Grid, Skeleton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type RelationHeaderProps = {
	illustration: ReactNode;
	title: string | undefined;
	secondTitle: string | null | undefined;
	trailing?: ReactNode;
};
const RelationPageHeader = (props: RelationHeaderProps) => {
	return (
		<Grid
			container
			spacing={2}
			flexWrap={"nowrap"}
			sx={{ width: "inherit", height: "auto" }}
		>
			<Grid size={{ xs: 4, sm: 3, md: 2, xl: 1 }} sx={{ margin: 2 }}>
				{props.illustration}
			</Grid>
			<Grid size="grow">
				<Stack
					spacing={2}
					sx={{ height: "100%", justifyContent: "center" }}
				>
					<Box>
						<Typography
							variant="h4"
							sx={{
								fontWeight: "bold",
								WebkitLineClamp: 2,
								display: "-webkit-box",
								WebkitBoxOrient: "vertical",
							}}
						>
							{props.title ?? <Skeleton width={"50%"} />}
						</Typography>
					</Box>
					{props.secondTitle !== null && (
						<Box>
							<Typography
								variant="h5"
								sx={{
									WebkitLineClamp: 3,
									display: "-webkit-box",
									WebkitBoxOrient: "vertical",
								}}
							>
								{props.secondTitle ?? <Skeleton />}
							</Typography>
						</Box>
					)}
				</Stack>
			</Grid>
			<Grid
				size={{ xs: 2, sm: 1 }}
				sx={{ alignItems: "center", display: "flex" }}
			>
				{props.trailing}
			</Grid>
		</Grid>
	);
};

export default RelationPageHeader;
