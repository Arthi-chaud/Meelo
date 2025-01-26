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

import { Button, Checkbox, Grid, MenuItem, NoSsr, Select } from "@mui/material";
import SectionHeader from "../section-header";
import { useColorScheme } from "@mui/material/styles";
import { type Language, Languages, persistLanguage } from "../../i18n/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";
import { Book1, Star, Warning2 } from "iconsax-react";

const SettingGroupStyle = {
	paddingTop: 1,
	paddingBottom: 2,
	rowSpacing: 4,
} as const;

const InputContainerStyle = {
	justifyContent: "flex-end",
	display: "flex",
} as const;

const RepositoryUrl = "https://github.com/Arthi-chaud/meelo";
const LinkIconStyle = { marginBottom: -5, marginRight: 5 };

const UserSettings = () => {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme();
	const [prefersNotifs, setPrefersNotif] = useLocalStorage(
		"allow_notifs",
		false,
	);
	const notificationsAPIAvailable = typeof Notification !== "undefined";
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		() => notificationsAPIAvailable && Notification.permission == "granted",
	);
	return (
		<NoSsr>
			<SectionHeader heading={t("colorScheme")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={11}>
					{t("useSystemeTheme")}
				</Grid>
				<Grid item xs={1} sx={InputContainerStyle}>
					<Checkbox
						onChange={(event, isChecked) =>
							colorScheme.setMode(
								isChecked
									? "system"
									: (colorScheme.systemMode ?? "light"),
							)
						}
						checked={colorScheme.mode == "system"}
					/>
				</Grid>
				<Grid item xs={11}>
					{t("useDarkTheme")}
				</Grid>
				<Grid item xs={1} sx={InputContainerStyle}>
					<Checkbox
						onChange={(event, isChecked) =>
							colorScheme.setMode(isChecked ? "dark" : "light")
						}
						disabled={colorScheme.mode === "system"}
						checked={
							colorScheme.mode === "dark" ||
							colorScheme.systemMode === "dark"
						}
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("language")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={10}>
					{t("language")}
				</Grid>
				<Grid item xs={2} sx={InputContainerStyle}>
					<Select
						size="small"
						value={i18n.language}
						onChange={(event) => {
							i18n.changeLanguage(event.target.value);
							persistLanguage(event.target.value as Language);
						}}
					>
						{Languages.map((language, languageIndex) => (
							<MenuItem
								key={languageIndex}
								value={language}
								style={{ borderRadius: 0 }}
							>
								{t(language)}
							</MenuItem>
						))}
					</Select>
				</Grid>
			</Grid>
			<SectionHeader heading={t("notifications")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={10}>
					{t("permissions")}
				</Grid>
				<Grid item xs={2} sx={InputContainerStyle}>
					<Button
						variant="contained"
						onClick={() => {
							if (!notificationsAPIAvailable) {
								return;
							}
							if (notificationsEnabled) {
								new Notification("Meelo says hello!", {
									body: "👋",
									silent: true,
								});
							} else {
								Notification.requestPermission().then(
									(value) =>
										value === "granted" &&
										setNotificationsEnabled(true),
								);
							}
						}}
						disabled={!notificationsAPIAvailable}
					>
						{!notificationsAPIAvailable
							? "unavailable"
							: notificationsEnabled
								? "test"
								: "ask"}
					</Button>
				</Grid>
				<Grid item xs={10}>
					{t("notifyOnTrackChange")}
				</Grid>
				<Grid item xs={2} sx={InputContainerStyle}>
					<Checkbox
						onChange={(_, isChecked) => {
							setPrefersNotif(isChecked);
						}}
						checked={prefersNotifs == true}
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("keyboadBindings")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={12}>
					{t("openKeyboarBindingsModalByTypingQuestionMark")}
				</Grid>
			</Grid>
			<SectionHeader heading={t("project")} />
			<p>
				<Star style={LinkIconStyle} />
				{t("enjoyingTheProject")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={RepositoryUrl}
				>
					{t("starOnGithub")}
				</Link>
			</p>
			<p>
				<Warning2 style={LinkIconStyle} />
				{t("encounteredABug")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={`${RepositoryUrl}/issues`}
				>
					{t("openAnIssue")}
				</Link>
			</p>
			<p>
				<Book1 style={LinkIconStyle} />
				<Link
					style={{ textDecoration: "underline" }}
					href="https://arthi-chaud.github.io/Meelo"
				>
					{t("readTheDoc")}
				</Link>
			</p>
		</NoSsr>
	);
};

export default UserSettings;
