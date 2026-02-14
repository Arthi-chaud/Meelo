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

import {
	Box,
	Chip,
	Grid,
	Skeleton,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import type IllustrationModel from "@/models/illustration";
import { useAccentColor } from "@/utils/accent-color";
import Illustration from "~/components/illustration";

type HighlightCardProps = {
	title: string | undefined;
	illustration: IllustrationModel | undefined | null;
	headline: string | undefined;
	body: string | ReactNode | undefined;
	href: string | undefined;
	tags: { label: string; href: string }[];
};

const HighlightCard = (props: HighlightCardProps) => {
	const theme = useTheme();
	const accentColor = useAccentColor(props.illustration);
	const cardColor = useMemo(() => {
		if (accentColor !== null) {
			const themePaperColor = `rgba(${theme.vars.palette.background.defaultChannel} / 0.75)`;
			return {
				[theme.getColorSchemeSelector("light")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.light} 40%, ${themePaperColor})`,
				},
				[theme.getColorSchemeSelector("dark")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.dark} 40%, ${themePaperColor})`,
				},
			};
		}
		return {
			backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.40)`,
		};
	}, [accentColor, theme]);
	const scrollbarColorStyle = useMemo(() => {
		return {
			[theme.getColorSchemeSelector("light")]: {
				scrollbarColor: `${accentColor?.light} transparent`,
			},
			[theme.getColorSchemeSelector("dark")]: {
				scrollbarColor: `${accentColor?.dark} transparent`,
			},
		};
	}, [accentColor, theme]);
	const style = {
		...cardColor,
		boxShadow: "none",
		transform: "scale(1)",
		transition: "transform 0.2s",
		":hover": {
			transform: "scale(1.03)",
			boxShadow: 5,
		},
	} as const;

	return (
		<Link href={props.href ?? {}} passHref legacyBehavior>
			<Grid
				container
				sx={{
					aspectRatio: "2.5",
					width: "100%",
					height: "100%",
					flexWrap: "nowrap",
					...style,
					overflow: "hidden",
					cursor: "pointer",
				}}
				style={{ borderRadius: theme.shape.borderRadius }}
			>
				<Grid sx={{ aspectRatio: "1", height: "100%" }}>
					<Illustration
						illustration={props.illustration}
						imgProps={{ borderRadius: 0 }}
						quality="medium"
					/>
				</Grid>
				<Grid container size="grow" sx={{ height: "100%" }}>
					<Stack
						sx={{
							width: "100%",
							height: "100%",
							padding: 2,
						}}
					>
						<Box sx={{ width: "100%" }}>
							<Typography
								variant="h6"
								noWrap
								style={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									width: "100%",
									paddingRight: 1,
								}}
							>
								{props.headline ?? <Skeleton variant="text" />}
							</Typography>
						</Box>
						<Box
							sx={{
								overflowY: "scroll",
								overflowX: "clip",
								flexGrow: 1,
								marginRight: -2,
								paddingY: 1,
								paddingRight: 2,
								...scrollbarColorStyle,
							}}
						>
							<Typography
								variant="body1"
								color="text.disabled"
								lineHeight={1.5}
							>
								{props.body ?? <Skeleton variant="text" />}
							</Typography>
						</Box>
						{props.tags.length > 0 && (
							<Grid
								container
								spacing={1}
								sx={{ marginTop: 1, height: 24 }}
							>
								{props.tags.map((tag, index) => (
									<Grid key={index}>
										<Link href={tag.href} key={index}>
											<Chip
												variant="filled"
												clickable
												label={tag.label}
											/>
										</Link>
									</Grid>
								))}
							</Grid>
						)}
					</Stack>
				</Grid>
			</Grid>
		</Link>
	);
};

export default HighlightCard;
