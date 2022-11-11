import { useQuery } from "react-query";
import { prepareMeeloQuery } from "../../query";
import API from '../../api';
import ModalPage from "../modal-page";
import AuthenticationForm from "./authentication-form";
import { Box, Grid } from "@mui/material";
import Image from 'next/image';
import { deleteCookie, getCookie } from "cookies-next";
import UserAccessTokenCookieKey from "../../utils/user-access-token-cookie-key";
import { useEffect, useState } from "react";

const statusQuery = (accessToken?: string) => ({
	key: ['user', 'status', accessToken ?? {}],
	exec: () => API.getCurrentUserStatus()
})

const AuthenticationWall = (props: { children: any }) => {
	const accessToken = getCookie(UserAccessTokenCookieKey)?.valueOf();
	const status = useQuery(prepareMeeloQuery(statusQuery, accessToken));
	const [authentified, setAuthenticationStatus] = useState(false);
	useEffect(() => {
		if (accessToken && !status.error) {
			setAuthenticationStatus(true);
		}
		if (status.error)
			deleteCookie(UserAccessTokenCookieKey);
		if (accessToken == undefined) {
			setAuthenticationStatus(false);
		}
	}, [accessToken, status, authentified]);

	if (!authentified) {
		return <ModalPage>
			<Grid container direction='column' sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Grid xs={2} item sx={{ position: 'relative', width: '100%' }}>
					<Image src="/banner.png" alt="title" fill style={{ objectFit: 'contain' }}/>
				</Grid>
				<Grid item xs>
					<AuthenticationForm onAuthenticated={() => setAuthenticationStatus(true)}/>
				</Grid>
			</Grid>
		</ModalPage>
	}
	return props.children
}

export default AuthenticationWall;