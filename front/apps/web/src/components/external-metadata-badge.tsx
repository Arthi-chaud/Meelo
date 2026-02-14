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

import { Box, Button, Skeleton } from "@mui/material";
import Link from "next/link";
import type { ExternalMetadataSource } from "@/models/external-metadata";
import { ProviderIcon } from "@/ui/icons";
import Illustration from "~/components//illustration";

type ExternalMetadataBadgeProps = {
	source: ExternalMetadataSource | undefined;
};

const ExternalMetadataBadge = ({ source }: ExternalMetadataBadgeProps) => {
	const badge = (
		<Button
			variant="outlined"
			startIcon={
				<Box sx={{ width: 30 }}>
					<Illustration
						url={source?.providerIcon ?? undefined}
						quality="original"
						fallback={<ProviderIcon />}
					/>
				</Box>
			}
		>
			{source?.providerName ?? <Skeleton width="50px" />}
		</Button>
	);

	if (source?.url) {
		return (
			<Link
				href={source.url ?? undefined}
				rel="noopener noreferrer"
				target="_blank"
			>
				{badge}
			</Link>
		);
	}
	return badge;
};

export default ExternalMetadataBadge;
