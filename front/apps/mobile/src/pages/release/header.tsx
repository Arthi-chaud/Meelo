import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { shuffle } from "lodash";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getAlbumExternalMetadata } from "@/api/queries";
import type { AlbumWithRelations } from "@/models/album";
import type { ReleaseWithRelations } from "@/models/release";
import { playTracksAtom, type TrackState } from "@/state/player";
import { PlayIcon, ShuffleIcon } from "@/ui/icons";
import { formatReleaseDate, useReleaseDate } from "@/ui/pages/release";
import formatDuration from "@/utils/format-duration";
import { useQuery } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Rating } from "~/components/rating";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { breakpoints } from "~/theme";

export const Header = ({
	release,
	album,
	totalDuration,
	isMixed,
	tracks,
}: {
	isMixed: boolean | undefined;
	release: ReleaseWithRelations<"illustration"> | undefined;
	tracks: TrackState[];
	album: AlbumWithRelations<"artist"> | undefined;
	totalDuration: number | null | undefined;
}) => {
	const { rt: _rt } = useUnistyles();
	const router = useRouter();
	const playTracks = useSetAtom(playTracksAtom);
	const { t } = useTranslation();
	const releaseDate = useReleaseDate(release, album);
	const { data: externalMetadata } = useQuery(
		(albumId) => getAlbumExternalMetadata(albumId),
		album?.id,
	);
	const dateAndDuration = useDateAndDuration(releaseDate, totalDuration);
	const extensions = useMemo(() => {
		if (release === undefined || isMixed === undefined) {
			return undefined;
		}
		if (isMixed) {
			return [...release.extensions, t("track.mixed")];
		}
		return release.extensions;
	}, [release, isMixed]);

	const playAlbum = useCallback(() => {
		playTracks({ tracks });
	}, [tracks]);

	const shuffleAlbum = useCallback(() => {
		playTracks({ tracks: shuffle(tracks) });
	}, [tracks]);
	return (
		<View style={styles.root}>
			<View style={styles.illustrationAndStats}>
				<View style={styles.illustrationFrame}>
					<View style={styles.illustration}>
						<Illustration
							illustration={release?.illustration}
							quality="original"
							dropShadow
							useBlurhash
						/>
					</View>
				</View>
				<View style={styles.headerColumn}>
					<LoadableText
						content={release?.name}
						style={styles.headerText}
						skeletonWidth={15}
						numberOfLines={3}
						variant="h2"
					/>
					{(!album || album.artist) && (
						<Pressable
							style={styles.headerArtistName}
							onPress={() =>
								router.navigate(`/artists/${album?.artist?.id}`)
							}
						>
							<LoadableText
								style={styles.headerText}
								content={album?.artist?.name}
								numberOfLines={1}
								skeletonWidth={10}
								variant="h4"
							/>
						</Pressable>
					)}
					<View style={styles.headerExtensionAndStat}>
						{extensions !== undefined && extensions.length > 0 && (
							<Text
								content={extensions.join(" • ")}
								style={styles.headerText}
								color="secondary"
							/>
						)}
						<View style={styles.headerAlbumStat}>
							{releaseDate !== null && (
								<LoadableText
									style={styles.headerText}
									skeletonWidth={10}
									color="secondary"
									content={dateAndDuration}
								/>
							)}
							{/* Only display stars if rating is loading or we know it's not null */}
							{externalMetadata &&
								externalMetadata.rating !== null && (
									<>
										{externalMetadata !== undefined && (
											<Text
												content={"•"}
												color="secondary"
											/>
										)}
										<Rating
											rating={
												externalMetadata?.rating ??
												undefined
											}
										/>
									</>
								)}
						</View>
					</View>
				</View>
			</View>

			<View style={styles.playbackControlsContainer}>
				<View style={styles.playbackControls}>
					<Pressable
						style={styles.playbackControl}
						onPress={playAlbum}
					>
						<Icon icon={PlayIcon} />
					</Pressable>
					<Pressable
						style={styles.playbackControl}
						onPress={shuffleAlbum}
					>
						<Icon icon={ShuffleIcon} />
					</Pressable>
				</View>
			</View>
		</View>
	);
};

// Returns release's formated release date, along with formatted runtime
const useDateAndDuration = (
	releaseDate: Date | null | undefined,
	totalDuration: number | null | undefined,
) => {
	const { i18n } = useTranslation();
	return useMemo(() => {
		if (releaseDate === undefined || totalDuration === undefined) {
			return undefined;
		}
		return [
			releaseDate
				? formatReleaseDate(releaseDate, i18n.language)
				: undefined,
			formatDuration(totalDuration),
		]
			.filter((item) => item !== undefined)
			.join(" • ");
	}, [totalDuration, releaseDate]);
};

const HalfHorizontalLayout = "md" as const;
const FullHorizontalLayout = "lg" as const;

// TODO: BUG: rt needs to be specified to show dependency on screen dims/breakpoint on tablet + horizontal mode?
// TODO: BUG: If we rotate the device, the breakpoint is not updated unless we rerender
const styles = StyleSheet.create((theme, _rt) => ({
	root: {
		flexDirection: { xs: "column", [FullHorizontalLayout]: "row" },
		paddingHorizontal: {
			xs: undefined,
			[HalfHorizontalLayout]: theme.gap(2),
		},
	},
	illustrationAndStats: {
		flexDirection: { xs: "column", [HalfHorizontalLayout]: "row" },
		gap: { xs: 0, [HalfHorizontalLayout]: theme.gap(2) },
		paddingBottom: { [HalfHorizontalLayout]: theme.gap(3) },
		flex: {
			xs: undefined,
			[HalfHorizontalLayout]: 1,
			[FullHorizontalLayout]: 2,
		},
	},
	headerText: {
		textAlign: "center",
		maxWidth: breakpoints.sm,
	},
	headerArtistName: {
		paddingLeft: { xs: undefined, [HalfHorizontalLayout]: theme.gap(0) },
		// When in horizontal layout, since artist name is button, it has padding around
		// We re-align it
	},
	headerExtensionAndStat: {
		gap: theme.gap(0.5),
	},
	headerAlbumStat: {
		flexDirection: "row",
		gap: theme.gap(0.5),
		justifyContent: "center",
		alignItems: "center",
	},
	headerColumn: {
		display: "flex",
		alignItems: { xs: "center", [HalfHorizontalLayout]: "flex-start" },
		justifyContent: {
			xs: "flex-start",
			[HalfHorizontalLayout]: "space-evenly",
		},
		paddingHorizontal: theme.gap(2),
		paddingTop: theme.gap(3),
		paddingBottom: theme.gap(2),
		gap: theme.gap(2),
		flex: { xs: undefined, [HalfHorizontalLayout]: 1 },
	},

	///
	illustrationFrame: {
		display: "flex",
		flexDirection: "row",
		justifyContent: { xs: "center" },
		padding: { xs: undefined, [HalfHorizontalLayout]: theme.gap(2) },
		flex: { xs: undefined, [HalfHorizontalLayout]: 1 },
		width: { xs: "100%", [HalfHorizontalLayout]: undefined },
	},
	illustration: {
		width: { xs: "60%", [HalfHorizontalLayout]: "100%" },
		maxWidth: { xs: breakpoints.sm, [HalfHorizontalLayout]: undefined },
	},

	///
	playbackControlsContainer: {
		flex: { xs: undefined, [FullHorizontalLayout]: 1 },
		alignItems: "center",
		justifyContent: {
			xs: undefined,
			[FullHorizontalLayout]: "space-evenly",
		},
	},
	playbackControls: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-evenly",
		maxWidth: breakpoints.sm,
		width: "100%",
		alignItems: "center",
		paddingVertical: theme.gap(0.5),
	},
	playbackControl: {
		// For nice hover bubbles
		padding: theme.gap(0.5),
	},
}));
