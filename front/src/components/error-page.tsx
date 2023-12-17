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

import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import Translate from "../i18n/translate";
import { useErrorBoundary } from "react-error-boundary";

type ErrorPageProps = {
	heading: string | JSX.Element;
};

/**
 * Common skeleton for error pages (404, 500)
 */
const ErrorPage = ({ heading }: ErrorPageProps) => {
	const { resetBoundary } = useErrorBoundary();

	return (
		<Box
			width="100%"
			display="flex"
			justifyContent="space-evenly"
			alignItems="center"
			minHeight="100vh"
			flexDirection="column"
		>
			<Typography
				variant="h1"
				sx={{
					overflow: "visible",
					width: "90%",
					fontStyle: "italic",
					textAlign: "center",
				}}
			>
				{heading}
			</Typography>
			<Link href="/" onClick={() => resetBoundary()}>
				<Button color="inherit" variant="outlined">
					<Translate translationKey="goBackHome" />
				</Button>
			</Link>
		</Box>
	);
};

export default ErrorPage;
