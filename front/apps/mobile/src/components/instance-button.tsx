import { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Action } from "~/actions";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";
import type { MeeloInstance } from "~/state/user";

type Props = {
	instance: MeeloInstance;
	enabled: boolean;
} & (
	| { trailing: string; actions?: never }
	| { trailing?: never; actions: Omit<Action, "label">[] }
);

export const InstanceButton = ({
	instance,
	enabled,
	trailing,
	actions,
}: Props) => {
	const cleanUrl = useMemo(() => {
		const url = new URL(instance.url);
		return url.host;
	}, [instance]);
	const textColor = enabled ? "primary" : "secondary";
	return (
		<View style={styles.root}>
			<View style={styles.label}>
				<Text content={cleanUrl} color={textColor} variant="h5" />
				<Text
					content={instance.username}
					color={textColor}
					variant="body"
				/>
			</View>
			<View style={styles.trailing}>
				{trailing ? (
					<Text color={textColor} content={trailing} />
				) : (
					actions?.map((action, idx) => (
						<Button
							key={idx}
							size="small"
							icon={action.icon}
							onPress={action.onPress ?? (() => {})}
						/>
					))
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { flexDirection: "row" },
	label: {
		flexDirection: "column",
		gap: theme.gap(1),
		flex: 1,
	},
	trailing: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		flex: 0,
	},
}));
