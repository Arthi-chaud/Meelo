import type { LayoutControl } from "@/infinite-controls/layout";
import type { SortControl } from "@/infinite-controls/sort";
import { AscIcon, DescIcon, GridIcon, ListIcon } from "@/ui/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "~/primitives/button";

//TODO Sort
//TODO Filter
//TODO Actions

type Props<SortingKey extends string> = {
	layout?: LayoutControl;
	sort?: SortControl<SortingKey>;
};

export const Controls = <S extends string>({ layout, sort }: Props<S>) => {
	const { t } = useTranslation();
	return (
		<View style={styles.root}>
			{sort && (
				<Button
					icon={sort.selected.order === "asc" ? AscIcon : DescIcon}
					iconPosition="right"
					onPress={() => {}}
					title={t(sort.formatItem(sort.selected.sort))}
				/>
			)}
			{layout && (
				<Button
					icon={layout.layout === "list" ? GridIcon : ListIcon}
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
}));
