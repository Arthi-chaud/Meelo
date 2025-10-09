import { Stack } from "expo-router";

export default function ProtectedRoot() {
	return (
		<Stack
			screenOptions={{
				freezeOnBlur: true,
				headerShown: false,
				headerTransparent: true,
				contentStyle: { backgroundColor: "transparent", flex: 1 },
			}}
		/>
	);
}
