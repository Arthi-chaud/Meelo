import type { ComponentProps } from "react";
import type { View } from "react-native";
import type { Area } from "@/models/area";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { useContextMenu } from "./context-menu";
import { useAreaContextMenu } from "./context-menu/resource/area";

export const AreaButton = ({
	area,
	textProps,
	containerProps,
}: {
	area: Area;
	textProps: Omit<ComponentProps<typeof Text>, "children" | "content">;
	containerProps: ComponentProps<typeof View>;
}) => {
	const areaContextMenu = useAreaContextMenu(area);
	const { openContextMenu } = useContextMenu(areaContextMenu);
	return (
		<Pressable onPress={openContextMenu} {...containerProps}>
			<Text content={area.name} {...textProps} />
		</Pressable>
	);
};
