import type { LayoutControl } from "@/infinite-controls/layout";
import type { SortControl } from "@/infinite-controls/sort";
import { AscIcon, DescIcon, GridIcon, ListIcon } from "@/ui/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";

//TODO Filter
//TODO Actions

// TODO: the external library feels shaky
// + causes us to do ugly workarind in styling (see infinite view's styling)
// We could implement the dropdown ourselves

type Props<SortingKey extends string> = {
	layout?: LayoutControl;
	sort?: SortControl<SortingKey>;
};

export const Controls = <S extends string>({ layout, sort }: Props<S>) => {
	const { t } = useTranslation();
	const OrderIcon = withUnistyles(
		sort?.selected.order === "desc" ? DescIcon : AscIcon,
		(theme) => ({
			color: theme.colors.text.primary,
			size: theme.fontSize.rem(1.25),
		}),
	);
	return (
		<View style={styles.root}>
			{sort && (
				<SelectDropdown
					data={[...sort.sortingKeys]}
					onSelect={(selected: S) => {
						if (selected === sort.selected.sort) {
							sort.onUpdate({
								sort: selected,
								order:
									sort.selected.order === "asc"
										? "desc"
										: "asc",
							});
						} else {
							sort.onUpdate({ sort: selected, order: "asc" });
						}
					}}
					dropdownStyle={styles.dropdownContainer}
					renderItem={(item) => (
						<View style={styles.dropdownItem}>
							<View style={styles.dropdownItemRow}>
								<View style={styles.dropdownItemIcon}>
									{sort.selected.sort === item ? (
										<OrderIcon />
									) : undefined}
								</View>

								<View style={styles.dropdownItemLabel}>
									<Text content={t(sort.formatItem(item))} />
								</View>
							</View>

							<Divider h />
						</View>
					)}
					statusBarTranslucent
					dropdownOverlayColor="transparent"
					renderButton={() => (
						<View>
							{/* If there is not parent view, the button is now displayed, shrug*/}
							<Button
								icon={
									sort.selected.order === "asc"
										? AscIcon
										: DescIcon
								}
								propagateToParent
								iconPosition="right"
								title={t(sort.formatItem(sort.selected.sort))}
							/>
						</View>
					)}
				/>
			)}
			{layout && (
				<Button
					icon={layout.layout === "list" ? GridIcon : ListIcon}
					containerStyle={styles.button}
					onPress={() => {
						layout.onUpdate({
							layout: layout.layout === "list" ? "grid" : "list",
							itemSize: layout.itemSize,
						});
					}}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	button: { elevation: 10 },
	dropdownContainer: {
		borderRadius: theme.borderRadius,
		width: 150,
		gap: theme.gap(2),
	},
	dropdownItem: { backgroundColor: theme.colors.background },
	dropdownItemRow: {
		display: "flex",
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(1),
	},
	dropdownItemIcon: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	dropdownItemLabel: {
		flex: 5,
		display: "flex",
		alignItems: "flex-start",
	},
}));
