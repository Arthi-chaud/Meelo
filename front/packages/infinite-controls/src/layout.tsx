import { useState } from "react";
import type { ItemSize, LayoutOption } from "@/models/layout";

export type LayoutControl = (
	| {
			layout: "list";
			itemSize: never;
			enableToggle: false;
	  }
	| {
			layout: "grid";
			itemSize: ItemSize;
			enableToggle: false;
	  }
	| {
			layout: LayoutOption;
			enableToggle: true;
			itemSize: ItemSize;
	  }
) & {
	onUpdate: (p: { layout: LayoutOption; itemSize: ItemSize }) => void;
};

type State = { layout: LayoutOption; itemSize: ItemSize };

// Hook to get Layout data to pass to Controls
export const useLayoutControl = ({
	defaultLayout,
	defaultItemSize,
	enableToggle,
	onUpdate,
	hook,
}: {
	hook: () => LayoutOption | null;
	defaultLayout: LayoutOption;
	enableToggle: boolean;
	onUpdate: LayoutControl["onUpdate"];
	defaultItemSize?: ItemSize;
}) => {
	const layout = hook();
	const [layoutState, setLayoutState] = useState<State>(() => ({
		layout: !enableToggle ? defaultLayout : (layout ?? defaultLayout),
		itemSize: defaultItemSize ?? "m",
	}));
	const control: LayoutControl = {
		layout: layoutState.layout,
		enableToggle: enableToggle as true,
		itemSize: layoutState.itemSize,
		onUpdate: (p) => {
			onUpdate(p as any);
			setLayoutState(p);
		},
	};
	return [layoutState, control] as const;
};
