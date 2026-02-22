import { FlashList } from "@shopify/flash-list";
import Animated from "react-native-reanimated";

export const AnimatedFlashlist = Animated.createAnimatedComponent(
	FlashList,
) as typeof FlashList;
