import type { Area } from "@/models/area";
import type Label from "@/models/label";
import { LabelIcon } from "@/ui/icons";
import { Chip } from "~/components/chip";
import { useContextMenu } from "~/components/context-menu";
import { useLabelContextMenu } from "~/components/context-menu/resource/label";
import { ListItem } from "../list-item";

type Props = {
	label: (Label & { area?: Area | null }) | undefined;
	withLeadingIcon?: boolean;
	subtitle?: string;
	onPress?: () => void;
};

export const LabelItem = ({
	label,
	subtitle,
	withLeadingIcon,
	onPress,
}: Props) => {
	const ctxMenu = useLabelContextMenu(label);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return (
		<ListItem
			{...(withLeadingIcon
				? {
						illustration: null,
						illustrationProps: { fallbackIcon: LabelIcon },
					}
				: { leading: null })}
			title={label?.name}
			subtitle={subtitle ?? null}
			onPress={() => {
				onPress?.();
				openContextMenu();
			}}
			contextMenu={ctxMenu}
		/>
	);
};

export const LabelChip = ({ label }: Props) => {
	const ctxMenu = useLabelContextMenu(label);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return <Chip title={label?.name} onPress={openContextMenu} />;
};
