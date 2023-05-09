import {
	Button, DialogActions, DialogContent, DialogTitle, Grid
} from "@mui/material";
import Library from "../models/library";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import Translate from "../i18n/translate";

type LibraryFormFields = Pick<Library, 'name' | 'path'>;

type LibraryFormProps = {
	defaultValues?: LibraryFormFields;
	onClose: () => void
	onSubmit: (values: LibraryFormFields) => void
};

const LibraryForm = (props: LibraryFormProps) => {
	const defaultValues = props.defaultValues ?? { name: '', path: '' };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values);
		props.onClose();
	};

	return <>
		<DialogTitle>{props.defaultValues ? 'Update' : 'Create'} Library</DialogTitle>
		<form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', height: '100%' }}>
			<DialogContent>
				<Grid container direction='column' spacing={3}>
					<HookTextField
						{...registerState('name')}
						textFieldProps={{
							autoFocus: true,
							fullWidth: true,
							label: 'Name of the library',
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: 'Name is required',
							},
						}}
					/>
					<HookTextField
						{...registerState('path')}
						textFieldProps={{
							fullWidth: true,
							label: 'Path of the library',
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: 'Path is required',
							},
						}}
					/>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>
					<Translate translationKey="cancel"/>
				</Button>
				<Button type='submit' color='primary' variant="contained">
					{props.defaultValues ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</form>
	</>;
};

export default LibraryForm;
