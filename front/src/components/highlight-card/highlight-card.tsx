import { Chip, Grid, Typography, useTheme } from "@mui/material";
import Link from "next/link";
import hexToRgba from "hex-to-rgba";
import IllustrationModel from "../../models/illustration";
import Illustration from "../illustration";
import { useMemo } from "react";
import useColorScheme from "../../theme/color-scheme";

type HighlightCardProps = {
	title: string;
	illustration?: IllustrationModel;
	headline: string;
	body: string | JSX.Element;
	href: string;
	tags: { label: string; href: string }[];
};

const HighlightCard = (props: HighlightCardProps) => {
	const theme = useTheme();
	const colorScheme = useColorScheme();
	const cardColor = useMemo(() => {
		const themePaperColor = hexToRgba(theme.palette.background.paper, 0.75);
		const sortedColors = Array.of(
			...(props.illustration?.colors ?? []),
		).sort();

		if (colorScheme == "light") {
			sortedColors.reverse();
		}
		const color = sortedColors.at(3);

		if (color) {
			return `color-mix(in srgb, ${color} 20%, ${themePaperColor})`;
		}
		return themePaperColor;
	}, [props, theme, colorScheme]);
	const style = {
		backgroundColor: cardColor,
		boxShadow: "none",
		transform: "scale(1)",
		transition: "transform 0.2s",
		":hover": {
			transform: "scale(1.05)",
			scale: 10,
			boxShadow: 6,
		},
	} as const;

	return (
		<Link href={props.href} passHref legacyBehavior>
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
				<Grid item xs sx={{ aspectRatio: "1", width: "100%" }}>
					<Illustration
						illustration={props.illustration ?? null}
						imgProps={{ borderRadius: 0 }}
						quality="med"
					/>
				</Grid>
				<Grid
					item
					container
					xs={8}
					sx={{ width: "100%", overflow: "hidden" }}
					direction="column"
					padding={2}
				>
					<Grid item sx={{ width: "100%" }}>
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
							{props.headline}
						</Typography>
					</Grid>
					<Grid
						item
						xs
						sx={{
							overflow: "scroll",
							marginRight: -2,
							paddingY: 1,
							paddingRight: 2,
						}}
					>
						<Typography
							variant="body1"
							color="text.disabled"
							lineHeight={1.5}
						>
							{props.body}
						</Typography>
					</Grid>
					{props.tags && (
						<Grid
							item
							container
							columnSpacing={1}
							sx={{ height: 32, overflow: "hidden" }}
						>
							{props.tags.map((tag, index) => (
								<Grid key={index} item>
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
				</Grid>
			</Grid>
		</Link>
	);
};

export default HighlightCard;
