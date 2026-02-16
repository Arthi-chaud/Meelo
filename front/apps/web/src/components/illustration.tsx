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

import { Box, IconButton, Skeleton, useTheme } from "@mui/material";
import Image, { type ImageProps } from "next/image";
import { type ReactNode, useState } from "react";
import type { RequireExactlyOne } from "type-fest";
import type IllustrationModel from "@/models/illustration";
import type { IllustrationQuality } from "@/models/illustration";
import { useAPI } from "~/api";
import { isSSR } from "~/utils/is-ssr";
import Blurhash from "./blurhash";
import Fade from "./fade";

type IllustrationProps = {
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback?: ReactNode;

	/**
	 * Aspect Ratio of the Illustration
	 * @default 1
	 */
	aspectRatio?: number;

	/**
	 * Quality preset, in which to dl the image.
	 */
	quality: IllustrationQuality;

	imgProps?: ImageProps["style"];
	alignBottom?: boolean;
} & RequireExactlyOne<{
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string | null | undefined;

	illustration: IllustrationModel | null | undefined;
}>;

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const api = useAPI();
	const [loadingState, setLoadingState] = useState<
		"loading" | "errored" | "finished"
	>(isSSR() ? "finished" : "loading");
	const url =
		props.url === null
			? null
			: (props.url ??
				(props.illustration === null ? null : props.illustration?.url));
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
			key={`illustration-${url}`}
			sx={{
				width: "100%",
				height: "100%",
				position: "relative",
				aspectRatio: props.aspectRatio?.toString() ?? "1",
				justifyContent: "center",
				alignItems: props.alignBottom ? "end" : "center",
				display: "flex",
			}}
		>
			<Fade
				in={props.illustration === undefined && props.url === undefined}
				unmountOnExit
			>
				<Skeleton
					variant="rounded"
					sx={{
						width: "100%",
						height: "100%",
						aspectRatio: props.aspectRatio?.toString() ?? "1",
					}}
				/>
			</Fade>
			{blurhash && (
				<Fade
					in={
						isSSR()
							? loadingState !== "errored"
							: loadingState !== "finished"
					}
					unmountOnExit
					timeout={{
						// Hack to avoid blurhash exiting before image is painted
						exit: theme.transitions.duration.leavingScreen * 3,
					}}
				>
					<Box
						style={{
							position: "absolute",
							borderRadius: theme.shape.borderRadius,
							overflow: "hidden",
							aspectRatio: aspectRatio.toString(),
							...props.imgProps,
							...(props.imgProps?.objectFit === "cover"
								? { width: "100%", height: "100%" }
								: dimensionsFromAspectRatio),
						}}
					>
						<Blurhash
							blurhash={blurhash}
							style={{ width: "100%", height: "100%" }}
						/>
					</Box>
				</Fade>
			)}
			{url !== undefined && (
				<Box
					style={{
						position: "relative",
						aspectRatio:
							props.imgProps?.objectFit === "cover"
								? undefined
								: aspectRatio.toString(),
						overflow: "hidden",
						display: "block",
						...(props.imgProps?.objectFit === "cover"
							? { width: "100%", height: "100%" }
							: dimensionsFromAspectRatio),
					}}
				>
					{loadingState === "errored" || url === null ? (
						<Box
							sx={{
								width: "100%",
								height: "100%",
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<Skeleton
								variant="rounded"
								animation={false}
								sx={{
									width: "100%",
									height: "100%",
									aspectRatio:
										props.aspectRatio?.toString() ?? "1",
								}}
							/>

							{props.fallback && (
								<Box
									sx={{
										top: 0,
										left: 0,
										bottom: 0,
										right: 0,
										position: "absolute",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<IconButton
										disabled
										sx={{ fontSize: "large" }}
										component="div"
									>
										{props.fallback}
									</IconButton>
								</Box>
							)}
						</Box>
					) : (
						<Image
							onError={() => setLoadingState("errored")}
							onLoad={() => setLoadingState("finished")}
							fill
							alt={
								url
									?.split("/")
									.concat(props.quality)
									.join("-") ?? "missing-illustration"
							}
							unoptimized
							style={{
								borderRadius:
									props.quality === "low"
										? 6
										: theme.shape.borderRadius,
								objectFit: "contain",
								opacity: loadingState === "loading" ? 0 : 1,
								transition: `opacity ${theme.transitions.duration.enteringScreen}ms ${theme.transitions.easing.easeIn}`,
								...props.imgProps,
							}}
							src={api.getIllustrationURL(url, props.quality)}
						/>
					)}
				</Box>
			)}
		</Box>
	);
};

export default Illustration;
