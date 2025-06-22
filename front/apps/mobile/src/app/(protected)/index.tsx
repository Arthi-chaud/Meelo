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
import { AlbumIcon, MasterIcon } from "@/ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "toastify-react-native";
import { useInfiniteQuery } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { MeeloBanner } from "~/components/meelo_banner";
import { useColorScheme } from "~/hooks/color-scheme";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";

const styles = StyleSheet.create((theme) => ({
	main: { paddingHorizontal: theme.gap(1) },
	container: {
		display: "flex",
		alignItems: "center",
		width: "100%",
	},
}));

export default function Root() {
	const { t } = useTranslation();
	const [colorScheme, setColorScheme] = useColorScheme();
	const [showSkeleton, setSkeleton] = useState(true);
	const albums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "addDate", order: "desc" }, ["illustration"]),
	);
	const pageStyle = useRootViewStyle();
	// useEffect(() => {
	// 	const i = setInterval(() => {
	// 		setSkeleton((x) => !x);
	// 	}, 3000);
	//
	// 	return () => clearInterval(i);
	// }, []);
	const firstAlbums = useMemo(
		() => albums.data?.pages.at(0)?.items.slice(0, 4),
		[albums.data],
	);

	return (
		<ScrollView style={[styles.main, pageStyle]}>
			<View style={{ flexDirection: "row" }}>
				<Illustration illustration={firstAlbums?.at(0)?.illustration} />
				<Illustration illustration={firstAlbums?.at(1)?.illustration} />
				<Illustration illustration={firstAlbums?.at(2)?.illustration} />

				<Illustration
					fallbackIcon={AlbumIcon}
					illustration={{
						aspectRatio: 1,
						colors: [],
						blurhash: "LGFFaXYk^6#M@-5c,1J5@[or[Q6.",
						url: "/illustration/0",
					}}
				/>
			</View>

			<View style={{ flexDirection: "row" }}>
				<Illustration illustration={firstAlbums?.at(3)?.illustration} />
				<Illustration
					fallbackIcon={AlbumIcon}
					illustration={firstAlbums ? null : undefined}
				/>
			</View>
			<View style={{ flexDirection: "row" }}>
				<Button
					title="Toggle"
					width="fitContent"
					onPress={() => {
						setColorScheme(
							colorScheme === "light" ? "dark" : "light",
						);
					}}
				/>
			</View>
			{(
				[
					"h1",
					"h2",
					"h3",
					"h4",
					"h5",
					"h6",
					"body",
					"subtitle",
				] as const
			).map((s) => {
				return (
					<LoadableText
						key={s}
						variant={s}
						skeletonWidth={s.length}
						content={showSkeleton ? undefined : s}
					/>
				);
			})}
			<Text variant="body" color="secondary">
				{t("browsing.sections.musicVideos")}
			</Text>
			<MeeloBanner />
			<View style={styles.container}>
				<Button
					onPress={() => {
						Toast.success(t("toasts.auth.accountCreated"));
					}}
					width="fitContent"
					variant="filled"
					title={"toast"}
				/>
				<Button
					onPress={() => {}}
					width="fitContent"
					leadingIcon={MasterIcon}
					title={t("actions.release.setAllTracksAsMaster")}
				/>
				<Divider h withInsets />
				<TextInput placeholder="Password" />
			</View>
			<View
				style={{
					flex: 1,
					height: 300,
					flexDirection: "row",
					display: "flex",
				}}
			>
				<View style={{ flex: 1 }} />
				<Divider withInsets v />
				<View style={{ flex: 1 }} />
			</View>
		</ScrollView>
	);
}
