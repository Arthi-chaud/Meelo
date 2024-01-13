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
import Translate, { useLanguage } from "../../i18n/translate";
import SectionHeader from "../section-header";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useColorScheme } from "@mui/material/styles";
import {
	allowNotifications,
	disableNotifications,
	resetLanguage,
	setLanguage,
} from "../../state/settingsSlice";
import { Language, Languages } from "../../i18n/i18n";
import { useState } from "react";

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
	const colorScheme = useColorScheme();
	const notificationPreference = useSelector(
		(state: RootState) => state.settings.allowNotifications,
	);
	const languagePreference = useSelector(
		(state: RootState) => state.settings.language,
	);
	const dispatch = useDispatch();
	const actualLanguage = useLanguage();
	const notificationsAPIAvailable = typeof Notification !== "undefined";
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		() => notificationsAPIAvailable && Notification.permission == "granted",
	);

	return (
		<NoSsr>
			<SectionHeader
				heading={<Translate translationKey="colorScheme" />}
			/>
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={11}>
					<Translate translationKey="useSystemeTheme" />
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
					<Translate translationKey="useDarkTheme" />
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
			<SectionHeader heading={<Translate translationKey="language" />} />
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={11}>
					<Translate translationKey="useSystemeLanguage" />
				</Grid>
				<Grid item xs={1} sx={InputContainerStyle}>
					<Checkbox
						onChange={(event, isChecked) =>
							dispatch(
								isChecked
									? resetLanguage()
									: setLanguage(actualLanguage),
							)
						}
						checked={languagePreference == "system"}
					/>
				</Grid>
				<Grid item xs={10}>
					<Translate translationKey="language" />
				</Grid>
				<Grid item xs={2} sx={InputContainerStyle}>
					<Select
						disabled={languagePreference == "system"}
						size="small"
						value={actualLanguage}
						onChange={(event) => {
							dispatch(
								setLanguage(event.target.value as Language),
							);
						}}
					>
						{Languages.map((language, languageIndex) => (
							<MenuItem
								key={languageIndex}
								value={language}
								style={{ borderRadius: 0 }}
							>
								<Translate translationKey={language} />
							</MenuItem>
						))}
					</Select>
				</Grid>
			</Grid>
			<SectionHeader
				heading={<Translate translationKey="notifications" />}
			/>
			<Grid container sx={SettingGroupStyle}>
				<Grid item xs={10}>
					<Translate translationKey="permissions" />
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
					<Translate translationKey="notifyOnTrackChange" />
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
