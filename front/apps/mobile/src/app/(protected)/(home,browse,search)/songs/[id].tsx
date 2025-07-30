import { getSong } from "@/api/queries";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "~/api";
import { SongHeader } from "~/components/resource-header";
import { SafeScrollView } from "~/components/safe-view";
import { Divider } from "~/primitives/divider";

export default function SongPage() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { data: song } = useQuery(() =>
		getSong(id, ["artist", "illustration", "featuring"]),
	);
	return (
		<SafeScrollView style={{}}>
			<SongHeader song={song} />
			<Divider h withInsets />
		</SafeScrollView>
	);
}
