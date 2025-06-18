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

import { MasterIcon } from "@/ui/icons";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "toastify-react-native";
import { MeeloBanner } from "~/components/meelo_banner";
import { useColorScheme } from "~/hooks/color-scheme";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";

const styles = StyleSheet.create((theme) => ({
	main: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
	container: {
		backgroundColor: theme.colors.background,
		display: "flex",
		alignItems: "center",
		width: "100%",
	},
}));

export default function Root() {
	const { t } = useTranslation();
	const [colorScheme, setColorScheme] = useColorScheme();

	return (
		<ScrollView style={styles.main}>
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
			).map((s) => (
				<Text key={s} variant={s}>
					{s}
				</Text>
			))}
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
