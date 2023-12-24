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

const en = {
	cancel: "Cancel",
	update: "Update",
	play: "Play",
	playAll: "Play All",
	shuffle: "Shuffle",
	done: "Done",
	edit: "Edit",
	delete: "Delete",
	libraries: "Libraries",
	users: "Users",
	interface: "Interface",
	home: "Home",
	search: "Search",
	settings: "Settings",
	create: "Create",
	playlists: "Playlists",
	playlist: "Playlist",
	linkCopied: "Link copied to clipboard",
	newlyAddedAlbums: "Newly Added Albums",
	latestAlbums: "Latest Albums",
	newlyAddedArtists: "Newly Added Artists",
	newlyAddedReleases: "Newly Added Releases",
	mostPlayedSongs: "Most Played Songs",
	errorOccured: "Oops... An error occured",
	pageNotFound: "Oops... Page not found",
	lyrics: "Lyrics",
	versions: "Versions",
	tracks: "Tracks",
	genres: "Genres",
	externalLinks: "External Links",
	disc: "Disc",
	otherAlbumReleases: "Other releases of the same album",
	musicVideos: "Music Videos",
	playlistReorderSuccess: "Playlist Reordered!",
	playlistReorderFail: "Playlist Reordering Failed",
	playlistItemDeletionSuccess: "Deletion Successful",
	topSongs: "Top Songs",
	topVideos: "Top Videos",
	artist: "Artist",
	artists: "Artists",
	albums: "Albums",
	album: "Album",
	songs: "Songs",
	song: "Song",
	videos: "Videos",
	seeAll: "See All",
	trackInformation: "Track Information",
	name: "Name",
	playCount: "Play Count",
	duration: "Duration",
	bitRate: "Bit Rate",
	type: "Type",
	extension: "Extension",
	path: "Path",
	registrationDate: "Registration Date",
	noLyricsFound: "No Lyrics Found",

	changeAlbumType: "Change Album Type",

	libraryDeleted: "Library deleted",
	libraryDeletionFail: "Deleting library failed",
	libraryCreated: "Library created",
	libraryCreationFail: "Creating library failed",
	libraryUpdated: "Library updated",

	nameOfLibrary: "Name of the library",
	nameIsRequired: "Name is required",
	pathOfLibrary: "Path of the library",
	pathIsRequired: "Path is required",
	goBackHome: "Go Back Home",

	warning: "Warning",
	downloadWarning:
		"Downloading copyrighted material you don't own is not authorized. Please proceed if, and only if, you own the original content.",
	download: "Download",
	compilation: "Compilation",

	clean: "Clean",
	refresh: "Refresh",
	scan: "Scan",
	refreshMetadata: "Refresh Metadata",

	createLibrary: "Create Library",

	deleteLibrary: "Delete Library",
	deleteLibraryAction: "Delete a Library",
	deleteLibraryWarning:
		"You are about to delete a library. This can not be undone",

	deleteUser: "Delete User",
	deleteUserWarning:
		"You are about to delete a user. This can not be undone.",
	userDeleted: "User deleted",
	userDeletionFail: "User deletion failed",
	userUpdateFail: "Updating user failed",

	userNowEnabled: "User is now enabled",
	userNowDisabled: "User is now disabled",
	userNowAdmin: "User is now an admin and can run administrative tasks",
	userNowNotAdmin: "User is not an admin anymore",
	you: "You",
	admin: "Admin",
	enabled: "Enabled",

	trackSetAsMaster: "Track set as Master",

	// Albums Types
	All: "All",
	StudioRecording: "Studio Recording",
	Single: "Single",
	LiveRecording: "Live Recording",
	Compilation: "Compilation",
	Soundtrack: "Soundtrack",
	RemixAlbum: "Remix Album",
	VideoAlbum: "Video Album",

	pluralStudioRecording: "Studio Albums",
	pluralSingle: "Singles",
	pluralLiveRecording: "Live Albums",
	pluralCompilation: "Compilations",
	pluralSoundtrack: "Soundtrack Albums",
	pluralRemixAlbum: "Remixes",
	pluralVideoAlbum: "Video Albums",

	onThisAlbum: "Featured Artists",

	backToTop: "Back To Top",
	changeLayout: "Change layout",

	// Sorting Keys
	sortBy: "Sort By",
	order: "Order",
	asc: "Asc",
	desc: "Desc",
	artistName: "Artist Name",
	releaseDate: "Release Date",
	addDate: "Add Date",
	albumCount: "Album Count",
	songCount: "Song Count",
	entryCount: "Entry Count",
	creationDate: "Creation Date",
	trackCount: "Track Count",
	releaseName: "Release Name",
	bitrate: "Bitrate",
	trackIndex: "Track Index",
	discIndex: "Disc Index",

	allLibraries: "All Libraries",

	// Actions
	setAsMaster: "Set as Master",
	setAllTracksAsMaster: "Set all tracks as Master",
	deleteFromPlaylist: "Delete from Playlist",
	changeIllutration: "Change Illustration",
	releaseSetAsMaster: "Release set as master",
	tracksUpdated: "Tracks successfully updated",

	librariesLoadFail: "Libraries could not be loaded",

	// Login
	username: "Username",
	password: "Password",
	confirmPassword: "Confirm",
	pleaseConfirm: "Please, confirm password",
	passwordsAreDifferent: "Password are different",
	signupButton: "New here ? Signup",
	signinButton: "Already have an account ? Login",
	usernameIsRequired: "Username is required",
	passwordIsRequired: "Password is required",
	usernameTooShort: "Username is too short",
	passwordTooShort: "Password is too short",
	accountCreated:
		"Congrats! Your Meelo account has been created. You now have to wait for the admin to enable your account",
	moreInfo: "More Info",
	share: "Share",
	playNext: "Play Next",
	playAfter: "Play After",
	new: "New",
	addToPlaylist: "Add to Playlist",
	seeLyrics: "See Lyrics",
	goToArtist: "Go To Artist",
	seeAlbums: "See Albums",
	seeSongs: "See Songs",
	goToAlbum: "Go To Album",
	seeReleases: "See Releases",
	seeOtherVersions: "See Other Versions",
	seeRelatedTracks: "See Related Tracks",
	scanLibraries: "Scan Libraries",
	cleanLibraries: "Clean Libraries",
	fetchMetadata: "Fetch Metadata",
	switchToDefaultLng: "Switch to default language",
	archive: "Archive",
	lightMode: "Light Mode",
	darkMode: "Dark Mode",
	autoMode: "Auto Mode",
	logout: "Logout",

	appearsOn: "Appears On",
	featuredOnPlaylists: "Featured On",
	bonusTracks: "Bonus Tracks",
	relatedAlbums: "Related Albums",
	changeSongType: "Change Song Type",
	Original: "Original",
	Remix: "Remix",
	Live: "Live",
	Acoustic: "Acoustic",
	Instrumental: "Instrumental",
	Edit: "Edit",
	Clean: "Clean",
	Demo: "Demo",
	Unknown: "Unknown",
	Acapella: "Acapella",

	refreshMetadataStarted:
		"Refreshing Metadata... (You might need to refresh the page)",
	refreshMetadataFailed: "Oops... Refreshing Metadata Failed",

	more: "More",
	networkError: "There seem to be some network issues...",
	playbackError:
		"The track's format is not supported by this browser. Skipping...",
	about: "About",
	showMore: "Show More",
	showLess: "Show Less",
	tasks: "Tasks",
	current: "Current",
	pending: "Pending",
	none: "None",
	bonusTrack: "Bonus Track",
	extras: "Extras",
	NonMusic: "Non-Music",
	colorScheme: "Theme",
	useSystemeTheme: "Use System Theme",
	useDarkTheme: "Use Dark Theme",
	language: "Language",
	useSystemeLanguage: "Use System Language",
	notifications: "Notifications",
	permissions: "Permissions",
	notifyOnTrackChange: "Notify On Track Change",

	en: "English",
	fr: "French",
	featuredAlbums: "Featured Albums",
};

export default en;
