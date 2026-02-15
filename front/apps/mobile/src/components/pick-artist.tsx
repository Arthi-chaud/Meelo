import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getArtist } from "@/api/queries";
import type Artist from "@/models/artist";
import type { ArtistWithRelations } from "@/models/artist";
import { generateArray } from "@/utils/gen-list";
import { useQueries, type useQuery } from "~/api";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { useModal } from "./bottom-modal-sheet";
import { ArtistItem } from "./item/resource/artist";

export const usePickArtistModal = (artists?: Artist[]) => {
	const content = useCallback(() => {
		if (artists === undefined) {
			return null;
		}
		return <PickArtistModal artists={artists} />;
	}, [artists]);
	return useModal({
		content,
		onDismiss: () => {},
	});
};

export const PickArtistModal = ({ artists }: { artists: Artist[] }) => {
	const { t } = useTranslation();
	const artistQueries = useQueries(
		...artists.map(
			(artist) =>
				[
					(artistId: number) => getArtist(artistId, ["illustration"]),
					artist.id,
				] satisfies Parameters<
					typeof useQuery<
						ArtistWithRelations<"illustration">,
						[number],
						ArtistWithRelations<"illustration">
					>
				>,
		),
	);
	const resolvedArtists = useMemo(() => {
		const queryRes = artistQueries.map((q) => q.data);
		const artists = queryRes.filter((a) => a !== undefined);
		if (artists.length !== queryRes.length) {
			return undefined;
		}
		return artists;
	}, [artistQueries]);

	return (
		<BottomSheetFlatList
			style={styles.root}
			contentContainerStyle={styles.list}
			data={
				(resolvedArtists ?? generateArray(2)) satisfies (
					| ArtistWithRelations<"illustration">
					| undefined
				)[]
			}
			ListHeaderComponent={
				<View style={styles.header}>
					<Text content={t("models.artist_plural")} variant="h4" />
				</View>
			}
			renderItem={({
				item: artist,
				index,
			}: {
				item: ArtistWithRelations<"illustration">;
				index: number;
			}) => (
				<>
					<ArtistItem artist={artist} />
					{index !== (resolvedArtists?.length ?? 0) - 1 && (
						<Divider h />
					)}
				</>
			)}
		/>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		height: rt.screen.height / 3,
		width: "100%",
	},
	header: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
	},
	list: { paddingBottom: theme.gap(3) },
}));
