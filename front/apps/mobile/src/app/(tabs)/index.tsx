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

import { useTranslation } from "react-i18next";
import { Button, View } from "react-native";
import { useColorScheme } from "~/hooks/color-scheme";
import { Text } from "~/primitives/text";

export default function Root() {
	const { t } = useTranslation();
	const [colorScheme, setColorScheme] = useColorScheme();

	return (
		<View>
			<Button
				title="Toggle"
				onPress={() => {
					setColorScheme(colorScheme === "light" ? "dark" : "light");
				}}
			/>
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
			<Text variant="body">{t("browsing.sections.musicVideos")}</Text>
			<Button title="AA" />
		</View>
	);
}
