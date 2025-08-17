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
import { useEffect, useMemo, useState } from "react";
import { initReactI18next } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ToastManager from "toastify-react-native";
import { store } from "@/state/store";
import "intl-pluralrules";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { UnistylesRuntime } from "react-native-unistyles";
import type { ToastConfigParams } from "toastify-react-native/utils/interfaces";
import { DefaultQueryOptions } from "@/api/query";
import { BackgroundGradient } from "~/components/background-gradient";
import { Modal } from "~/components/bottom-modal-sheet";
import { useColorScheme } from "~/hooks/color-scheme";
import { Toast as MeeloToast } from "~/primitives/toast";
import { colorSchemePreference } from "~/state/color-scheme";
import { languagePreference } from "~/state/lang";
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
	const colorSchemePref = store.get(colorSchemePreference);
	const rnColorScheme = useColorScheme();
	const actualColorScheme = useMemo(() => {
		if (colorSchemePref === "system") {
			return rnColorScheme ?? "light";
		}
		return colorSchemePref;
	}, [rnColorScheme, colorSchemePref]);

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: DefaultQueryOptions,
				},
			}),
	);
	useEffect(() => {
		i18next.use(initReactI18next).init({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			lng: store.get(languagePreference),
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
		<GestureHandlerRootView>
			<QueryClientProvider client={queryClient}>
				<Provider store={store}>
					<ColorSchemeProvider>
						<BottomSheetModalProvider>
							<KeyboardProvider>
								<Stack
									screenOptions={{
										animation: "none",
										animationTypeForReplace: "pop",
										headerShown: false,
										contentStyle: {
											flex: 1,
										},
										statusBarStyle:
											actualColorScheme === "light"
												? "dark"
												: "light",
									}}
								>
									<Stack.Screen
										name="(protected)"
										options={{
											contentStyle: {
												backgroundColor: "transparent",
											},
										}}
									/>

									<Stack.Screen
										name="auth"
										options={{
											contentStyle: {
												backgroundColor:
													(actualColorScheme ===
													"dark"
														? appThemes.dark
														: appThemes.light
													).colors.background,
											},
										}}
									/>
								</Stack>
								<Modal />
							</KeyboardProvider>
						</BottomSheetModalProvider>
						<BackgroundGradient />
					</ColorSchemeProvider>
				</Provider>
				<ToastManager
					theme={actualColorScheme}
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
		</GestureHandlerRootView>
	);
}

const ColorSchemeProvider = ({ children }: any) => {
	const colorScheme = useColorScheme();
	useEffect(() => {
		UnistylesRuntime.setTheme(colorScheme);
	}, [colorScheme]);
	return children;
};
