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

import { Box, Link, Skeleton } from "@mui/material";
import ExternalId from "../models/external-id";
import { useState } from "react";
import { capitalCase } from "change-case";
import { useTranslation } from "react-i18next";

type Props = {
	externalDescription: ExternalId | undefined;
};

const ResourceDescriptionExpandable = ({ externalDescription }: Props) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const maxLine = 5;
	const smallBoxStyle = {
		overflow: "hidden",
		display: "-webkit-box",
		WebkitLineClamp: maxLine,
		lineClamp: maxLine,
		WebkitBoxOrient: "vertical",
	} as const;
	const bigBoxStyle = {};
	const { t } = useTranslation();

	return (
		<Box id="description" sx={isExpanded ? bigBoxStyle : smallBoxStyle}>
			{externalDescription
				? externalDescription.description
				: Array(5)
						.fill(undefined)
						.map((_, index) => <Skeleton key={index} />)}
			{isExpanded && (
				<>
					{" Source: "}
					<Link
						href={externalDescription?.url ?? undefined}
						rel="noopener noreferrer"
						target="_blank"
					>
						{externalDescription ? (
							capitalCase(externalDescription?.provider.name)
						) : (
							<Skeleton width={50} />
						)}
					</Link>
					{"."}
				</>
			)}{" "}
			{externalDescription && (
				<Link
					href="#description"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{t(isExpanded ? "showLess" : "showMore")}
				</Link>
			)}
		</Box>
	);
};

export default ResourceDescriptionExpandable;
