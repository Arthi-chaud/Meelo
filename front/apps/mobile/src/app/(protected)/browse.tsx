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

import { getAlbums } from "@/api/queries";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { Illustration } from "~/components/illustration";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Text } from "~/primitives/text";

// const styles = StyleSheet.create({
// 	flat_list: {
// 		gap: 16,
// 	},
// 	item: {
// 		flex: 1,
// 		padding: 16,
// 		borderRadius: 8,
// 		alignItems: "center",
// 		justifyContent: "center",
// 	},
// });

export default function BrowseView() {
	const rootStyle = useRootViewStyle();

	const albums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "addDate", order: "desc" }, [
			"illustration",
			"artist",
		]),
	);
	return (
		<View style={[rootStyle, { flex: 1 }]}>
			<FlashList
				data={albums.items}
				numColumns={3}
				keyExtractor={(item) => item.id.toString()}
				onEndReached={() => albums.fetchNextPage()}
				renderItem={(album) => (
					<View style={{ flex: 1, borderWidth: 1 }}>
						<Illustration illustration={album.item.illustration} />
						<View
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
							}}
						>
							<Text variant="h6" numberOfLines={2}>
								{album.item.name}
							</Text>
							<Text
								variant="body"
								style={{
									flex: 1,
									height: "100%",
									display: "flex",
									justifyContent: "flex-end",
									alignItems: "flex-end",
								}}
							>
								{album.item.artist?.name}
							</Text>
						</View>
					</View>
				)}
			/>
		</View>
	);
}
