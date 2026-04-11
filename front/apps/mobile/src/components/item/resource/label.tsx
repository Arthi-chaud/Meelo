import type Label from "@/models/label";
import { Chip } from "~/components/chip";
import { useContextMenu } from "~/components/context-menu";
import { useLabelContextMenu } from "~/components/context-menu/resource/label";
import { ListItem } from "../list-item";

type Props = { label: Label | undefined };

export const LabelItem = ({ label }: Props) => {
	const ctxMenu = useLabelContextMenu(label);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return (
		<ListItem
			leading={null}
			title={label?.name}
			subtitle={null}
			onPress={openContextMenu}
			contextMenu={ctxMenu}
		/>
	);
};

export const LabelChip = ({ label }: Props) => {
	const ctxMenu = useLabelContextMenu(label);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return <Chip title={label?.name} onPress={openContextMenu} />;
};
