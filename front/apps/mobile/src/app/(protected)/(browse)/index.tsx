import { useRouter } from "expo-router";
import { View } from "react-native";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Text } from "~/primitives/text";

export default function BrowseList() {
	const router = useRouter();
	const rootStyle = useRootViewStyle();
	return (
		<View style={rootStyle}>
			<Text
				content="Artists"
				onPress={() => router.push("/(protected)/(browse)/artists")}
			/>
			<Text
				content="Albums"
				onPress={() => router.push("/(protected)/(browse)/albums")}
			/>
		</View>
	);
}
