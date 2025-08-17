import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getAlbumExternalMetadata } from "@/api/queries";
import type { AlbumWithRelations } from "@/models/album";
import type { ReleaseWithRelations } from "@/models/release";
import { formatReleaseDate, useReleaseDate } from "@/ui/pages/release";
import formatDuration from "@/utils/format-duration";
import { useQuery } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Rating } from "~/components/rating";
import { useAccentColor } from "~/hooks/accent-color";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { breakpoints } from "~/theme";

export const Header = ({
	release,
	album,
	totalDuration,
	isMixed,
}: {
	isMixed: boolean | undefined;
	release: ReleaseWithRelations<"illustration"> | undefined;
	album: AlbumWithRelations<"artist"> | undefined;
	totalDuration: number | null | undefined;
}) => {
	const router = useRouter();
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
	const accentColor = useAccentColor(release?.illustration);
	return (
		<>
			<View style={styles.illustrationFrame}>
				<View style={styles.illustration}>
					<Illustration
						illustration={release?.illustration}
						style={{}}
						quality="original"
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
										<Text content={"•"} color="secondary" />
									)}
									<Rating
										color={accentColor}
										rating={
											externalMetadata?.rating ??
											undefined
										}
									/>
								</>
							)}
						{/* TODO accent color */}
					</View>
				</View>
			</View>
		</>
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

const styles = StyleSheet.create((theme) => ({
	headerText: {
		textAlign: "center",
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
		alignItems: "center",
		justifyContent: "flex-start",
		paddingHorizontal: theme.gap(2),
		paddingTop: theme.gap(3),
		paddingBottom: theme.gap(2),
		gap: theme.gap(2),
	},

	illustrationFrame: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		width: "100%",
	},
	illustration: {
		width: "60%",
		maxWidth: breakpoints.sm,
	},
}));
