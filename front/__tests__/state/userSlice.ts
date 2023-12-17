import userReducer, {
	setAccessToken,
	setUserProfile,
	unsetAccessToken,
} from "../../src/state/userSlice";

describe("User Slice", () => {
	let state: ReturnType<typeof userReducer> | undefined = undefined;

	it("Should set the access token", () => {
		state = userReducer({}, setAccessToken("1234"));

		expect(state).toStrictEqual({ accessToken: "1234" });
	});

	it("Should set the user profile", () => {
		const user = { id: 1, name: "user", admin: true, enabled: true };
		state = userReducer(state, setUserProfile(user));

		expect(state).toStrictEqual({ accessToken: "1234", user });
	});

	it("Should unset the access token, and user profile", () => {
		state = userReducer(state, unsetAccessToken());

		expect(state.accessToken).toBeUndefined();
	});
});
