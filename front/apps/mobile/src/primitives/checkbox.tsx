import { Checkbox } from "expo-checkbox";
import { withUnistyles } from "react-native-unistyles";

export const CheckBox = withUnistyles(Checkbox, (theme) => ({
	color: theme.colors.text.primary,
}));
