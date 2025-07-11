import type { ReleaseWithRelations } from "@/models/release";
import { getYear } from "@/utils/date";
import { type ComponentProps, useMemo } from "react";
import { Tile } from "..";

const ReleaseTile = (props: {
	release: ReleaseWithRelations<"illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
}) => {
	const subtitle = useMemo(() => {
		if (!props.release) {
			return undefined;
		}
		const extensions = props.release.extensions;
		const yearFormat = props.release
			? (getYear(props.release.releaseDate)?.toString() ?? "")
			: "";
		if (extensions.length > 0 && yearFormat.length > 0) {
			return [extensions[0], yearFormat].join(" - ");
		}
		if (extensions.length > 0) {
			return extensions[0];
		}
		return yearFormat;
	}, [props.release]);

	return (
		<Tile
			title={props.release?.name}
			subtitle={subtitle}
			href={props.release ? `/releases/${props.release.id}` : null}
			illustration={props.release?.illustration}
			illustrationProps={props.illustrationProps}
		/>
	);
};

export default ReleaseTile;
