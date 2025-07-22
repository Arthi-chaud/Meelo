import { CheckIcon, type Icon as IconType } from "@/ui/icons";
import { type ComponentProps, useMemo } from "react";
import { View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";

type Props<T> = {
	values: readonly T[];
	isSelected: (item: T) => boolean;
	onSelect: (item: T) => void;
	formatItem: (item: T) => string;
	checkIcon?: IconType;
	buttonProps: Omit<
		ComponentProps<typeof Button>,
		"propagateToParent" | "onPress"
	>;
};

export const Dropdown = <T,>({
	values,
	onSelect,
	formatItem,
	buttonProps,
	isSelected,
	checkIcon,
}: Props<T>) => {
	const notReadonlyArray = useMemo(() => [...values], [values]);
	return (
		<SelectDropdown
			data={notReadonlyArray}
			onSelect={onSelect}
			dropdownStyle={styles.dropdownContainer}
			renderItem={(item: T) => (
				<View style={styles.dropdownItem}>
					<View style={styles.dropdownItemRow}>
						<View style={styles.dropdownItemIconContainer}>
							{isSelected(item) ? (
								<Icon
									icon={checkIcon ?? CheckIcon}
									style={styles.dropdownItemIcon}
								/>
							) : undefined}
						</View>

						<Text
							style={styles.dropdownItemLabel}
							content={formatItem(item)}
						/>
					</View>

					<Divider h />
				</View>
			)}
			statusBarTranslucent
			dropdownOverlayColor="transparent"
			renderButton={() => (
				<View>
					<Button {...buttonProps} propagateToParent />
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	dropdownContainer: {
		borderRadius: theme.borderRadius,
		//TODO Can overflow
		width: 150,
		gap: theme.gap(2),
	},
	dropdownItem: { backgroundColor: theme.colors.background },
	dropdownItemRow: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		padding: theme.gap(1),
	},
	dropdownItemIconContainer: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	dropdownItemIcon: {
		size: theme.fontSize.rem(1),
	} as any,
	dropdownItemLabel: {
		flex: 5,
		display: "flex",
		alignItems: "flex-start",
	},
}));
