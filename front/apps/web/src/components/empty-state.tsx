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

import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type Action from "~/components/actions";

export type EmptyStateProps = {
	icon: React.ReactNode;
	text: TranslationKey;
	actions: Action[];
};

export const EmptyState = (props: EmptyStateProps) => {
	const { t } = useTranslation();

	return (
		<Stack
			direction="column"
			spacing={3}
			sx={{
				paddingTop: 3,
				width: "100%",
				height: "100%",
				justifyContent: "center",
				display: "flex",
				alignItems: "center",
				color: "text.disabled",
			}}
		>
			<Box>{props.icon}</Box>
			<Typography>{t(props.text)}</Typography>
			<Grid container sx={{ display: "flex", justifyContent: "center" }}>
				{props.actions?.map((a, i) => (
					<Button
						variant="outlined"
						key={i}
						href={a.href}
						onClick={a.onClick}
					>
						{t(a.label)}
					</Button>
				))}
			</Grid>
		</Stack>
	);
};
