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
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useColorScheme } from "~/hooks/color-scheme";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";

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
		<View style={styles.main}>
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
			<View style={styles.container}>
				<Button
					onPress={() => {
						console.log("ok");
					}}
					variant="outlined"
					title={t("auth.signin")}
					width="fill"
				/>
				<Button
					onPress={() => {}}
					width="fitContent"
					variant="filled"
					title={t("auth.signup")}
				/>

				<Button
					onPress={() => {}}
					width="fitContent"
					leadingIcon={MasterIcon}
					title={t("actions.release.setAllTracksAsMaster")}
				/>
			</View>
		</View>
	);
}
