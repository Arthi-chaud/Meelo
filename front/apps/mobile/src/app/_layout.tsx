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

import { store } from "@/state/store";
import {
	Rubik_300Light,
	Rubik_400Regular,
	Rubik_500Medium,
	Rubik_600SemiBold,
	Rubik_700Bold,
	Rubik_800ExtraBold,
	Rubik_900Black,
} from "@expo-google-fonts/rubik";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import i18next from "i18next";
import { Provider } from "jotai";
import { useEffect, useState } from "react";
import { initReactI18next } from "react-i18next";
import ToastManager from "toastify-react-native";
import "intl-pluralrules";
import { DefaultQueryOptions } from "@/api/query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ToastConfigParams } from "toastify-react-native/utils/interfaces";
import { useColorScheme } from "~/hooks/color-scheme";
import { Toast as MeeloToast } from "~/primitives/toast";
import { appThemes } from "~/theme";
import resources from "../../../../translations";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
	duration: 1000,
	fade: true,
});

export default function RootLayout() {
	const [loaded, error] = useFonts({
		Rubik_300Light,
		Rubik_400Regular,
		Rubik_500Medium,
		Rubik_600SemiBold,
		Rubik_700Bold,
		Rubik_800ExtraBold,
		Rubik_900Black,
	});
	const [colorScheme] = useColorScheme();

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: DefaultQueryOptions,
				},
			}),
	);
	useEffect(() => {
		//TODO set store with local storage values
		i18next.use(initReactI18next).init({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			lng: "en", // TODO Choose using local storage
			resources,
		});
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<Provider store={store}>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: {
							backgroundColor: (colorScheme === "light"
								? appThemes.light
								: appThemes.dark
							).colors.background,
							flex: 1,
						},
						//TODO give the status bar a background
						statusBarStyle:
							colorScheme === "light" ? "dark" : "light",
					}}
				/>
			</Provider>
			<ToastManager
				theme={colorScheme}
				custom={MeeloToast}
				config={{
					success: (p: ToastConfigParams) => (
						<MeeloToast {...p} variant={"success"} />
					),
					error: (p: ToastConfigParams) => (
						<MeeloToast {...p} variant={"error"} />
					),
				}}
			/>
		</QueryClientProvider>
	);
}
