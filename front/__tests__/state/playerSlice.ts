import playerReducer, { playAfter, playNext, playPreviousTrack, playTrack, playTracks, skipTrack } from '../../src/state/playerSlice';

const dummyTrackState = (n: number) => ({
	track: {
		id: n,
		illustration: null,
		songId: n,
		releaseId: n,
		name: '',
		master: true,
		type: 'Audio' as const,
		bitrate: n,
		duration: n,
		stream: '',
		sourceFileId: -1
	},
	artist: {
		id: n,
		illustration: '',
		name: 'A',
		slug: 'a'
	},
	release: {
		id: n,
		illustration: '',
		name: 'A',
		slug: 'a',
		master: true,
		albumId: n,
	}
})

describe('User Slice', () => {
	let state: ReturnType<typeof playerReducer> | undefined = undefined;
	
	it('Should set one track', () => {
		state = playerReducer(state, playTrack(dummyTrackState(1)));

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1)]);
	});

	it('Should add one track at the end (1)', () => {
		state = playerReducer(state, playNext(dummyTrackState(2)));

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(2)]);
	});

	it('Should add one track at the end (2)', () => {
		state = playerReducer(state, playAfter(dummyTrackState(3)));

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should add one track after', () => {
		state = playerReducer(state, playNext(dummyTrackState(4)));

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should skip to the next track', () => {
		state = playerReducer(state, skipTrack());

		expect(state.cursor).toBe(1);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should skip to the next track (2)', () => {
		state = playerReducer(state, skipTrack());

		expect(state.cursor).toBe(2);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should play previous track', () => {
		state = playerReducer(state, playPreviousTrack());

		expect(state.cursor).toBe(1);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should play track to the end', () => {
		state = playerReducer(state, playPreviousTrack());
		state = playerReducer(state, playPreviousTrack());
		state = playerReducer(state, playPreviousTrack());
		state = playerReducer(state, playPreviousTrack());

		expect(state.cursor).toBe(-1);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should start playlist again', () => {
		state = playerReducer(state, skipTrack());

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(4), dummyTrackState(2), dummyTrackState(3)]);
	});

	it('Should apply whole playlist', () => {
		state = playerReducer(state, playTracks({ tracks: [dummyTrackState(1)] }));

		expect(state.cursor).toBe(0);
		expect(state.playlist).toStrictEqual([dummyTrackState(1)]);
	});

	it('Should apply whole playlist, with cursor', () => {
		state = playerReducer(state, playTracks({ tracks: [dummyTrackState(1), dummyTrackState(2)], cursor: 1 }));

		expect(state.cursor).toBe(1);
		expect(state.playlist).toStrictEqual([dummyTrackState(1), dummyTrackState(2)]);
	});
});