import CommunityCheckBox from "@react-native-community/checkbox";
import { withUnistyles } from "react-native-unistyles";

export const CheckBox = withUnistyles(CommunityCheckBox, (theme) => ({
	tintColors: {
		true: theme.colors.text.primary,
		false: theme.colors.text.primary,
	},
}));
