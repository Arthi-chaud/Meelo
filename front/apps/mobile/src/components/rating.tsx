import { StarIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Icon } from "~/primitives/icon";
import { TextSkeleton } from "~/primitives/text";

export const Rating = ({
	rating,
}: {
	// Out of 100
	rating: number | undefined;
}) => {
	return (
		<View style={styles.root}>
			{rating ? (
				generateArray(5, undefined).map((_, idx) => (
					<Icon
						key={idx}
						icon={StarIcon}
						style={styles.star(rating ?? 0, idx)}
					/>
				))
			) : (
				<TextSkeleton width={11} />
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flexDirection: "row",
		gap: theme.gap(0.25),
		justifyContent: "center",
	},
	star: (rating: number, starIndex: number) => ({
		size: theme.fontSize.rem(1),
		color:
			Math.ceil(rating / 20) >= starIndex + 1
				? theme.colors.text.primary
				: theme.colors.text.secondary,
	}),
}));
