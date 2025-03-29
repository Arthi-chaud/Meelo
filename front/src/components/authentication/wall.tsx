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

import { Grid } from "@mui/material";
import { useEffect, useState } from "react";

import { useAtom } from "jotai";
import { useQuery as useReactQuery } from "react-query";
import API from "api/api";
import { prepareMeeloQuery } from "api/use-query";
import { accessTokenAtom, userAtom } from "state/user";
import ModalPage from "components/modal-page";
import ThemedImage from "components/themed-image";
import AuthenticationForm from "./form";

const AuthenticationWall = (props: { children: any }) => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [_, setUser] = useAtom(userAtom);
	const status = useReactQuery({
		...prepareMeeloQuery(API.getCurrentUserStatus),
		useErrorBoundary: false,
	});
	const [authentified, setAuthenticationStatus] = useState(
		status.data?.id !== undefined,
	);

	useEffect(() => {
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
				<Grid
					container
					direction="column"
					sx={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexWrap: "nowrap",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Grid
						xs={2}
						item
						sx={{
							position: "relative",
							width: "100%",
							display: "flex",
							justifyContent: "center",
						}}
					>
						<ThemedImage
							light={"/banner-black.png"}
							dark={"/banner.png"}
							alt="title"
							width={200}
							height={150}
							priority
							style={{ objectFit: "contain" }}
						/>
					</Grid>
					<Grid item xs>
						<AuthenticationForm />
					</Grid>
				</Grid>
			</ModalPage>
		);
	}
	return props.children;
};

export default AuthenticationWall;
