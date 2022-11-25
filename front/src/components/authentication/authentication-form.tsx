import {
	Button, Divider, Grid
} from '@mui/material';
import { HookTextField, useHookForm } from 'mui-react-hook-form-plus';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import API from '../../api/api';
import { setAccessToken } from '../../state/userSlice';

/**
 * Authentication form
 * On successful authentication, update store with access token
 */
const AuthenticationForm = () => {
	const dispatch = useDispatch();
	const [formType, setFormType] = useState<'login' | 'signup'>('login');
	const defaultValues = { username: '', password: '', confirm: '' };
	const [password, setPassword] = useState(defaultValues.password);
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});

	const onSubmit = async (values: typeof defaultValues) => {
		try {
			if (formType == 'signup') {
				const createdUser = await API.register(values);

				if (!createdUser.enabled) {
					setFormType('login');
					toast.success("Congrats! Your Meelo account has been created. You now have to wait for the admin to enable your account");
					return;
				}
			}
			dispatch(setAccessToken((await API.login(values)).access_token));
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', height: '100%' }}>
			<Grid container direction='column' spacing={3} sx={{ display: 'flex', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
				<HookTextField
					{...registerState('username')}
					textFieldProps={{
						label: 'Username',
						color: 'secondary'
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: 'Username is required',
						},
						minLength: {
							value: 4,
							message: 'Username is too short'
						}
					}}
				/>
				<HookTextField
					{...registerState('password')}
					textFieldProps={{
						label: 'Password',
						type: 'password',
						color: 'secondary',
						onChange: (event) => setPassword(event.target.value)
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: 'Password is required',
						},
						minLength: {
							value: 6,
							message: 'Password is too short'
						}
					}}
				/>
				{ formType == 'signup' &&
				<HookTextField
					{...registerState('confirm')}
					textFieldProps={{
						label: 'Confirm',
						type: 'password',
						color: 'secondary'
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: 'Please, confirm password',
						},
						validate: (confirmValue) => {
							if (confirmValue !== password) {
								return "Password are different";
							}
						}
					}}
				/>
				}
				<Grid item>
					<Button type="submit" color='secondary' variant='contained' onClick={() => {}}>
						{formType == 'login' ? 'Login' : 'Signup'}
					</Button>
				</Grid>
				<Divider sx={{ width: '100%', paddingY: 1 }} variant='middle'/>
				<Grid item>
					<Button color='secondary' variant='outlined'
						onClick={() => setFormType(formType == 'login' ? 'signup' : 'login')}
					>
						{formType == 'login' ? "New here ? Signup" : 'Already have an account ? Login'}
					</Button>
				</Grid>
			</Grid>
		</form>
	);
};

export default AuthenticationForm;
