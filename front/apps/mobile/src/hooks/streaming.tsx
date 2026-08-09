import { useEffect, useState } from "react";
import { getSettings } from "@/api/queries";
import { useQuery } from "~/api";

export const useTranscoderIsAvailable = () => {
	const [isAvailable, setIsAvailable] = useState<boolean | null>();
	const { data: settings, refetch } = useQuery(getSettings);
	useEffect(
		() =>
			setIsAvailable(
				!settings || settings.transcoderAvailable === undefined
					? null
					: settings.transcoderAvailable === true,
			),
		[settings],
	);
	return { isAvailable, refresh: refetch };
};
