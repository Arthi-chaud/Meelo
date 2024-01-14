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

import { Box, IconButton, useTheme } from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import API from "../api/api";
import whiteIllustrationFallback from "../../public/icon.png";
import blackIllustrationFallback from "../../public/icon-black.png";
import { RequireExactlyOne } from "type-fest";
import IllustrationModel from "../models/illustration";
import Blurhash from "./blurhash";
import { isSSR } from "../ssr";
import Fade from "./fade";
import ThemedImage from "../utils/themed-image";

type ImageQuality = "low" | "medium" | "high" | "original";

type IllustrationProps = {
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback?: JSX.Element;

	/**
	 * Aspect Ratio of the Illustration
	 * @default 1
	 */
	aspectRatio?: number;

	/**
	 * Quality preset, in which to dl the image.
	 */
	quality: ImageQuality;

	imgProps?: ImageProps["style"];
} & RequireExactlyOne<{
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string | null;

	illustration: IllustrationModel | null;
}>;

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);
	const [loadingCompleted, setLoadingCompleted] = useState(false);
	const url = props.url ?? props.illustration?.url;
	const blurhash = props.illustration?.blurhash;
	const aspectRatio =
		props.aspectRatio ?? props.illustration?.aspectRatio ?? 1;
	const dimensionsFromAspectRatio = {
		width: (props.illustration?.aspectRatio ?? 1) >= 1 ? "100%" : undefined,
		height:
			(props.illustration?.aspectRatio ?? 1) <= 1 ? "100%" : undefined,
	};

	return (
		<Box
			key={"illustration-" + url}
			sx={{
				width: "100%",
				height: "100%",
				position: "relative",
				aspectRatio: props.aspectRatio?.toString() ?? "1",
				justifyContent: "center",
				alignItems: "center",
				display: "flex",
			}}
		>
			{blurhash && (
				<Fade in={!loadingCompleted && !loadingFailed} unmountOnExit>
					<Box
						style={{
							position: "absolute",
							borderRadius: theme.shape.borderRadius,
							overflow: "hidden",
							aspectRatio: aspectRatio.toString(),
							...props.imgProps,
							...dimensionsFromAspectRatio,
						}}
					>
						<Blurhash
							blurhash={blurhash}
							style={{ width: "100%", height: "100%" }}
						/>
					</Box>
				</Fade>
			)}
			<Fade in={isSSR() || loadingCompleted || loadingFailed || !url}>
				<Box
					style={{
						position: "relative",
						aspectRatio: aspectRatio.toString(),
						overflow: "hidden",
						display: "block",
						...dimensionsFromAspectRatio,
					}}
				>
					{loadingFailed || !url ? (
						props.fallback ? (
							<IconButton
								disabled
								sx={{ fontSize: "large" }}
								component="div"
							>
								{props.fallback}
							</IconButton>
						) : (
							<ThemedImage
								dark={whiteIllustrationFallback}
								light={blackIllustrationFallback}
								fill
								alt="missing-illustration"
								loading="eager"
								style={{ padding: "15%" }}
							/>
						)
					) : (
						<Image
							onError={() => setLoadingFailed(true)}
							onLoadingComplete={() => setLoadingCompleted(true)}
							fill
							alt={
								url?.split("/").join("-") ??
								"missing-illustration"
							}
							unoptimized
							style={{
								borderRadius:
									props.quality == "low"
										? 6
										: theme.shape.borderRadius,
								objectFit: "contain",
								...props.imgProps,
							}}
							src={
								API.getIllustrationURL(url) +
								(props.quality == "original"
									? ""
									: `?quality=${props.quality}`)
							}
						/>
					)}
				</Box>
			</Fade>
		</Box>
	);
};

export default Illustration;
