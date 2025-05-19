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

import {
	Box,
	Button,
	Checkbox,
	Grid,
	MenuItem,
	NoSsr,
	Select,
	Skeleton,
	Slider,
	Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Book1, Star, Warning2 } from "iconsax-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";
import { useAPI, useQuery } from "~/api/hook";
import { getScrobblerStatus } from "~/api/queries";
import SectionHeader from "~/components/section-header";
import { type Language, Languages, persistLanguage } from "~/i18n/i18n";
import { type Scrobbler, Scrobblers } from "~/models/scrobblers";
import { CheckIcon, OpenExternalIcon } from "../icons";

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

const UISettings = () => {
	const { t, i18n } = useTranslation();
	const colorScheme = useColorScheme();
	const api = useAPI();
	const scrobblers = useQuery(() => getScrobblerStatus());
	const displayScrobbler = useCallback(
		(scrobbler: Scrobbler) => {
			if (!scrobblers.data) {
				return false;
			}
			return (
				scrobblers.data.connected.includes(scrobbler) ||
				scrobblers.data.available.includes(scrobbler)
			);
		},
		[scrobblers.data],
	);
	const anyScrobblersIsEnabled = useMemo(
		() =>
			scrobblers.data &&
			(scrobblers.data.available.length > 0 ||
				scrobblers.data.connected.length > 0),
		[scrobblers.data],
	);
	const router = useRouter();
	const [prefersNotifs, setPrefersNotif] = useLocalStorage(
		"allow_notifs",
		false,
	);

	const [crossfade, setCrossfade] = useLocalStorage("crossfade", 1.5);
	const notificationsAPIAvailable = typeof Notification !== "undefined";
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		() =>
			notificationsAPIAvailable && Notification.permission === "granted",
	);
	return (
		<NoSsr>
			<SectionHeader heading={t("settings.ui.playback")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.crossfade")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Slider
						step={0.5}
						min={0}
						defaultValue={crossfade}
						onChangeCommitted={(_, n) => {
							setCrossfade(n);
						}}
						valueLabelFormat={(n) => `${n}s`}
						max={12}
						valueLabelDisplay="auto"
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.colorScheme")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 11 }}>{t("settings.ui.useSystemTheme")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 1 }}>
					<Checkbox
						onChange={(_, isChecked) =>
							colorScheme.setMode(
								isChecked
									? "system"
									: (colorScheme.systemMode ?? "light"),
							)
						}
						checked={colorScheme.mode === "system"}
					/>
				</Grid>
				<Grid size={{ xs: 11 }}>{t("settings.ui.useDarkTheme")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 1 }}>
					<Checkbox
						onChange={(_, isChecked) =>
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
			<SectionHeader heading={t("settings.ui.language")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.language")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
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
								{t(`settings.ui.lang.${language}`)}
							</MenuItem>
						))}
					</Select>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.notifications")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.permissions")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
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
				<Grid size={{ xs: 10 }}>
					{t("settings.ui.notifyOnTrackChange")}
				</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Checkbox
						onChange={(_, isChecked) => {
							setPrefersNotif(isChecked);
						}}
						checked={prefersNotifs === true}
					/>
				</Grid>
			</Grid>

			<SectionHeader heading={t("settings.ui.scrobblers.header")} />
			<Box
				sx={{
					...SettingGroupStyle,
					justifyContent: "space-between",
					alignItems: "center",
					display: "flex",
				}}
			>
				<Typography>
					{t("settings.ui.scrobblers.connect_scrobblers")}
				</Typography>

				<Grid container columnSpacing={2}>
					{scrobblers.data === undefined ? (
						<Button variant="outlined">
							<Skeleton width={"50px"} />
						</Button>
					) : anyScrobblersIsEnabled ? (
						<>
							{Scrobblers.map(
								(scrobbler) =>
									displayScrobbler(scrobbler) && (
										<Button
											disabled={scrobblers.data.connected.includes(
												scrobbler,
											)}
											variant="outlined"
											onClick={async () => {
												// TODO Handle ListenBrainz
												router.push(
													(
														await api.getLastFMAuthUrl(
															window.location
																.origin,
														)
													).url,
												);
											}}
											startIcon={
												scrobblers.data.connected.includes(
													scrobbler,
												) ? (
													<CheckIcon size={"1em"} />
												) : undefined
											}
											endIcon={
												!scrobblers.data.connected.includes(
													scrobbler,
												) ? (
													<OpenExternalIcon
														size={"1em"}
													/>
												) : undefined
											}
										>
											{scrobbler}
										</Button>
									),
							)}
						</>
					) : (
						<Typography
							sx={{ fontStyle: "italic", color: "text.disabled" }}
						>
							{t("settings.ui.scrobblers.no_scrobblers_enabled")}
						</Typography>
					)}
				</Grid>
			</Box>

			<SectionHeader heading={t("settings.ui.keyboardBindings")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 12 }}>
					{t(
						"settings.ui.openKeyboarBindingsModalByTypingQuestionMark",
					)}
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.project")} />
			<p>
				<Star style={LinkIconStyle} />
				{t("settings.ui.external.enjoyingTheProject")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={RepositoryUrl}
				>
					{t("settings.ui.external.starOnGithub")}
				</Link>
			</p>
			<p>
				<Warning2 style={LinkIconStyle} />
				{t("settings.ui.external.encounteredABug")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={`${RepositoryUrl}/issues`}
				>
					{t("settings.ui.external.openAnIssue")}
				</Link>
			</p>
			<p>
				<Book1 style={LinkIconStyle} />
				<Link
					style={{ textDecoration: "underline" }}
					href="https://github.com/Arthi-chaud/Meelo/wiki"
				>
					{t("settings.ui.external.readTheDoc")}
				</Link>
			</p>
		</NoSsr>
	);
};

export default UISettings;
