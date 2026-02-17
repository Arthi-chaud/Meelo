import { Stack, useLocalSearchParams } from "expo-router";
import {
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { HeaderBackground } from "~/components/navigation";
import ReleasePage from "~/pages/release";

export default function Page() {
	const { id: releaseId } = useLocalSearchParams<{ id: string }>();
	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});
	const headerStyle = useAnimatedStyle(
		() => ({
			opacity: interpolate(scrollY.value, [30, 100], [0, 1], {
				extrapolateLeft: "clamp",
			}),
		}),
		[],
	);

	return (
		<>
			<Stack.Screen
				options={{
					headerBackground: () => (
						<HeaderBackground
							style={[{ opacity: 0 }, headerStyle]}
						/>
					),
				}}
			/>

			<ReleasePage releaseId={releaseId} scrollHandler={scrollHandler} />
		</>
	);
}
