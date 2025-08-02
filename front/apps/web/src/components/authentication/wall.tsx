/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Box, Stack } from "@mui/material";
import {
	useQueryClient,
	useQuery as useReactQuery,
} from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserStatus } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import { getAPI_ } from "~/api";
import ModalPage from "~/components/modal-page";
import ThemedImage from "~/components/themed-image";
import { accessTokenAtom, userAtom } from "~/state/user";
import AuthenticationForm from "./form";

const AuthenticationWall = (props: { children: any }) => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [_, setUser] = useAtom(userAtom);
	const api = useMemo(() => getAPI_(accessToken ?? null), [accessToken]);
	const queryClient = useQueryClient();
	const status = useReactQuery({
		...toTanStackQuery(api, getCurrentUserStatus),
		throwOnError: false,
	});
	const [authentified, setAuthenticationStatus] = useState(
		status.data?.id !== undefined,
	);

	useEffect(() => {
		queryClient.invalidateQueries({ queryKey: getCurrentUserStatus().key });
		status.refetch();
	}, [accessToken]);
	useEffect(() => {
		if (accessToken && status.data?.id && !status.error) {
			setAuthenticationStatus(true);
		}
		if (status.error || accessToken === undefined) {
			setAuthenticationStatus(false);
		}
	}, [accessToken, status, authentified]);
	useEffect(() => {
		if (accessToken && status.data && !status.error) {
			setUser(status.data);
		}
	}, [accessToken, status]);
	if (!authentified || !status.data?.id) {
		return (
			<ModalPage open>
				<Stack
					sx={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexWrap: "nowrap",
						justifyContent: "space-evenly",
						alignItems: "center",
					}}
				>
					<Box
						sx={{
							position: "relative",
							width: "100%",
							display: "flex",
							justifyContent: "center",
						}}
					>
						<ThemedImage
							light={"/banner1-black.png"}
							dark={"/banner1-white.png"}
							alt="title"
							width={200}
							height={150}
							priority
							style={{ objectFit: "contain" }}
						/>
					</Box>
					<Box flexGrow={1}>
						<AuthenticationForm />
					</Box>
				</Stack>
			</ModalPage>
		);
	}
	return props.children;
};

export default AuthenticationWall;
