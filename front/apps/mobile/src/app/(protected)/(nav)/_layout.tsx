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

import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import {
	TabList,
	TabSlot,
	Tabs,
	TabTrigger,
	type TabTriggerSlotProps,
} from "expo-router/ui";
import { useAtomValue, useSetAtom } from "jotai";
import { type Ref, useCallback, useEffect, useMemo } from "react";
import {
	type GestureResponderEvent,
	type LayoutChangeEvent,
	View,
} from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { getCurrentUserStatus } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import { infiniteQueryAtom, playlistAtom } from "@/state/player";
import {
	BrowseIcon,
	HomeIcon,
	type Icon as IconType,
	SearchIcon,
	SettingsIcon,
} from "@/ui/icons";
import { useAPI } from "~/api";
import { BlurView } from "~/components/blur-view";
import { PlayerContext } from "~/components/player/context";
import { ExpandedPlayerSlot } from "~/components/player/expanded/slot";
import { MinimisedPlayer } from "~/components/player/minimised";
import { bottomTabBarHeightAtom } from "~/hooks/root-view-style";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

//TODO DRY: The header style for settings is very similar to the shared routed ones.
//TODO I suspect that the setting header style is not updated when theme changes because we don't use withUnistyles
//However, the latter does not work
//TODO (Re)move header style

const styles = StyleSheet.create((theme) => ({
	screen: { backgroundColor: "transparent", flex: 1 },
	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
	headerBackgroundContainer: {
		...StyleSheet.absoluteFillObject,
		borderBottomLeftRadius: theme.borderRadius,
		borderBottomRightRadius: theme.borderRadius,
		overflow: "hidden",
	},
	headerBackgroundContent: { flex: 1 },
	footer: {
		position: "absolute",
		bottom: 0,
		width: "100%",
	},
	tabBar: {
		paddingTop: theme.gap(2),
		paddingBottom: theme.gap(4),
		flexDirection: "row",
		backgroundColor: "transparent",
		justifyContent: "space-around",
	},
	tabBarBackground: {
		...StyleSheet.absoluteFillObject,
		borderTopLeftRadius: theme.borderRadius,
		borderTopRightRadius: theme.borderRadius,
		overflow: "hidden",
		backgroundColor: "transparent",
	},
	hiddenTabList: { display: "none" },
	player: {
		width: "100%",
		paddingHorizontal: theme.gap(0.75),
	},
}));

export default function ProtectedLayout() {
	const queue = useAtomValue(playlistAtom);

	const infinitePlaylist = useAtomValue(infiniteQueryAtom);
	const accessToken = useAtomValue(accessTokenAtom);
	const instanceUrl = useAtomValue(instanceUrlAtom);
	const setBottomTabBarHeight = useSetAtom(bottomTabBarHeightAtom);
	const api = useAPI();
	const user = useTanStackQuery({
		...toTanStackQuery(api, getCurrentUserStatus),
		enabled: !!(accessToken && instanceUrl),
	});
	const onLayout = useCallback((e: LayoutChangeEvent) => {
		setBottomTabBarHeight(e.nativeEvent.layout.height);
	}, []);
	const queueIsEmpty = useMemo(() => queue.length === 0, [queue]);
	const queueIsInfinite = useMemo(
		() => infinitePlaylist !== null,
		[infinitePlaylist],
	);
	const theme = useAnimatedTheme();

	// For the slide up animation
	const playerMarginBottom = useSharedValue(-1000);
	// For the padding between the tabbar and the player
	const playerPaddingBottom = useSharedValue(0);
	useEffect(() => {
		if (!queueIsEmpty || queueIsInfinite) {
			const style = {
				stiffness: 1110,
				damping: 510,
			};
			playerMarginBottom.value = withSpring(0, style);
			playerPaddingBottom.value = withSpring(
				theme.value.gap(0.75),
				style,
			);
		}
	}, [queueIsEmpty, queueIsInfinite]);

	if (!accessToken || !instanceUrl || user.error) {
		return <Redirect href="/auth" />;
	}
	//TODO Proper handling of when user is loading
	return (
		<Tabs options={{ screenOptions: { freezeOnBlur: true } }}>
			<TabSlot style={styles.screen} />
			<View style={styles.footer} onLayout={onLayout}>
				<View style={styles.player}>
					{/* TODO blur behing player, like iOS */}
					{(!queueIsEmpty || queueIsInfinite) && (
						<Animated.View
							style={{
								marginBottom: playerMarginBottom,
								paddingBottom: playerPaddingBottom,
							}}
						>
							<MinimisedPlayer />
						</Animated.View>
					)}
				</View>
				<ExpandedPlayerSlot />
				<PlayerContext />
				<View style={styles.tabBar}>
					<BlurView style={styles.tabBarBackground} />

					<TabTrigger name="(home)" asChild>
						<TabButton icon={HomeIcon} />
					</TabTrigger>
					<TabTrigger name="(browse)" asChild>
						<TabButton icon={BrowseIcon} />
					</TabTrigger>
					<TabTrigger name="(search)" asChild>
						<TabButton icon={SearchIcon} />
					</TabTrigger>
					<TabTrigger name="settings" asChild>
						<TabButton icon={SettingsIcon} />
					</TabTrigger>
				</View>
			</View>
			{/* Shrug https://docs.expo.dev/router/advanced/custom-tabs/#multiple-tab-bars */}
			<TabList style={styles.hiddenTabList}>
				<TabTrigger name="(home)" href="/(protected)/(nav)/(home)" />
				<TabTrigger
					name="(browse)"
					href="/(protected)/(nav)/(browse)"
				/>
				<TabTrigger
					name="(search)"
					href="/(protected)/(nav)/(search)"
				/>
				<TabTrigger
					name="settings"
					href="/(protected)/(nav)/settings"
				/>
			</TabList>
		</Tabs>
	);
}

export type TabButtonProps = TabTriggerSlotProps & {
	icon: IconType;
	ref?: Ref<View>;
};

export function TabButton({ icon, isFocused, ...props }: TabButtonProps) {
	const onPress = useCallback(
		(e: GestureResponderEvent) => {
			props.onPress?.(e);
		},
		[props.onPress],
	);

	const onLongPress = useCallback(
		(e: GestureResponderEvent) => {
			props.onLongPress?.(e);
		},
		[props.onLongPress],
	);
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			disabled={false}
			disableRequestAnimationFrame
		>
			<Icon icon={icon} variant={isFocused ? "Bold" : undefined} />
		</Pressable>
	);
}
