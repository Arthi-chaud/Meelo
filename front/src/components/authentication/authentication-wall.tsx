import { prepareMeeloQuery } from "../../api/use-query";
import ModalPage from "../modal-page";
import AuthenticationForm from "./authentication-form";
import { Grid } from "@mui/material";
import Image from 'next/image';
import { useEffect, useState } from "react";
import API from "../../api/api";
import { RootState } from "../../state/store";
import { useDispatch, useSelector } from "react-redux";
import { setUserProfile } from "../../state/userSlice";
import { useQuery as useReactQuery } from "react-query";
import useColorScheme from "../../theme/color-scheme";

const AuthenticationWall = (props: { children: any }) => {
	const accessToken = useSelector((store: RootState) => store.user.accessToken);
	const status = useReactQuery({
		...prepareMeeloQuery(API.getCurrentUserStatus),
		useErrorBoundary: false,
	});
	const colorScheme = useColorScheme();
	const dispatch = useDispatch();
	const [authentified, setAuthenticationStatus] = useState(status.data?.id !== undefined);

	useEffect(() => {
		status.refetch();
	}, [accessToken]);
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
		if (accessToken && status.data && !status.error) {
			dispatch(setUserProfile(status.data));
		}
	}, [accessToken, status, dispatch]);
	if (!authentified || !status.data?.id) {
		return <ModalPage open={!(accessToken && !status.data && status.isLoading) ||
			(accessToken !== undefined && status.error != null)}
		>
			<Grid container direction='column' sx={{
				width: '100%', height: '100%', display: 'flex', flexWrap: 'nowrap',
				justifyContent: 'center', alignItems: 'center'
			}}>
				<Grid xs={2} item sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
					<Image src={colorScheme == 'dark' ? "/banner.png" : "/banner-black.png"} alt="title" width={200} height={150} priority style={{ objectFit: 'contain' }}/>
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
