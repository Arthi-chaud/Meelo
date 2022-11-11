import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GetServerSidePropsContext } from "next";

type ContextState = {
	context: GetServerSidePropsContext
}

export const contextSlice = createSlice({
	name: 'context',
	initialState: <Partial<ContextState>>{
		context: undefined
	},
	reducers: {
		setContext: (state, action: PayloadAction<ContextState['context']>) => {
			state.context = action.payload;
		},
	}
})


export const { setContext } = contextSlice.actions

export default contextSlice.reducer