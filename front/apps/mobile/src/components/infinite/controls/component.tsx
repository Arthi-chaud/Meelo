import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { FilterControl } from "@/infinite-controls/filters/control";
import type { LayoutControl } from "@/infinite-controls/layout";
import type { SortControl } from "@/infinite-controls/sort";
import { AscIcon, DescIcon, GridIcon, ListIcon } from "@/ui/icons";
import { Dropdown } from "~/components/dropdown";
import { Button } from "~/primitives/button";

//TODO Actions
//TODO Height of buttons is not consistent

type Props<SortingKey extends string> = {
	layout?: LayoutControl;
	sort?: SortControl<SortingKey>;
	filters?: FilterControl<any>[];
};

export const Controls = <S extends string>({
	layout,
	sort,
	filters,
}: Props<S>) => {
	const { t } = useTranslation();
	const OrderIcon = withUnistyles(
		sort?.selected.order === "desc" ? DescIcon : AscIcon,
		(theme) => ({
			color: theme.colors.text.primary,
			size: theme.fontSize.rem(1),
		}),
	);
	return (
		<View style={styles.root}>
			{filters?.map((filter, idx) => (
				<Dropdown
					key={idx}
					buttonProps={{
						title: t(filter.buttonLabel),
						icon: filter.buttonIcon as any,
						iconPosition: "right",
					}}
					values={filter.values ?? []}
					isSelected={(item) =>
						filter.multipleChoice
							? filter.selected.includes(item)
							: filter.selected === item
					}
					formatItem={(item) => t(filter.formatItem(item))}
					onSelect={(selected) => {
						if (filter.multipleChoice) {
							const selectedKeys = filter.selected.includes(
								selected,
							)
								? filter.selected.filter((k) => k !== selected)
								: [selected, ...filter.selected];
							filter.onUpdate(selectedKeys);
						} else {
							filter.onUpdate(
								filter.selected === selected ? null : selected,
							);
						}
					}}
				/>
			))}
			{sort && (
				<Dropdown
					values={sort.sortingKeys}
					formatItem={(item) => t(sort.formatItem(item))}
					buttonProps={{
						title: t(sort.formatItem(sort.selected.sort)),
						icon:
							sort.selected.order === "asc" ? AscIcon : DescIcon,
						iconPosition: "left",
					}}
					isSelected={(item) => sort.selected.sort === item}
					checkIcon={OrderIcon}
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
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	button: { elevation: 10 },
}));
