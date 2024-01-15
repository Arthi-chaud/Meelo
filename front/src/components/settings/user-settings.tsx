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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useColorScheme } from "@mui/material/styles";
import {
	allowNotifications,
	disableNotifications,
} from "../../state/settingsSlice";
import { Language, Languages, persistLanguage } from "../../i18n/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SettingGroupStyle = {
	paddingTop: 1,
	paddingBottom: 2,
	rowSpacing: 4,
} as const;

const InputContainerStyle = {
	justifyContent: "flex-end",
	display: "flex",
} as const;

const UserSettings = () => {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme();
	const notificationPreference = useSelector(
		(state: RootState) => state.settings.allowNotifications,
	);
	const dispatch = useDispatch();
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
									: colorScheme.systemMode ?? "light",
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
						onChange={(event, isChecked) =>
							dispatch(
								isChecked
									? allowNotifications()
									: disableNotifications(),
							)
						}
						checked={notificationPreference}
					/>
				</Grid>
			</Grid>
		</NoSsr>
	);
};

export default UserSettings;
