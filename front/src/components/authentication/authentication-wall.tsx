import { useQuery } from "../../api/use-query";
import ModalPage from "../modal-page";
import AuthenticationForm from "./authentication-form";
import { Grid } from "@mui/material";
import Image from 'next/image';
import { useEffect, useState } from "react";
import API from "../../api/api";
import { RootState } from "../../state/store";
import { useDispatch, useSelector } from "react-redux";
import { setUserProfile } from "../../state/userSlice";

const statusQuery = (accessToken?: string) => ({
	key: [
		'user',
		'status',
		accessToken ?? {}
	],
	exec: () => API.getCurrentUserStatus().catch(() => null)
});

const AuthenticationWall = (props: { children: any }) => {
	const accessToken = useSelector((store: RootState) => store.user.accessToken);
	const status = useQuery(statusQuery, accessToken?.valueOf());
	const dispatch = useDispatch();
	const [authentified, setAuthenticationStatus] = useState(false);

	useEffect(() => {
		if (accessToken && status.data?.id && !status.error) {
			setAuthenticationStatus(true);
		}
		if (status.error || accessToken?.valueOf() == undefined) {
			setAuthenticationStatus(false);
		}
	}, [
		accessToken,
		status,
		authentified
	]);

	useEffect(() => {
		if (status.data && !status.error) {
			dispatch(setUserProfile(status.data));
		}
	}, [status, dispatch]);

	if (!authentified || !status.data?.id) {
		if (accessToken && !status.data && status.isLoading) {
			return <></>;
		}
		return <ModalPage>
			<Grid container direction='column' sx={{
				width: '100%', height: '100%', display: 'flex',
				justifyContent: 'center', alignItems: 'center'
			}}>
				<Grid xs={2} item sx={{ position: 'relative', width: '100%' }}>
					<Image src="/banner.png" alt="title" fill style={{ objectFit: 'contain' }}/>
				</Grid>
				<Grid item xs>
					<AuthenticationForm/>
				</Grid>
			</Grid>
		</ModalPage>;
	}
	return props.children;
};

export default AuthenticationWall;
