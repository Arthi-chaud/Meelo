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

import en from "./en";
import { TranslationMap } from "./type";

const fr: TranslationMap = {
	cancel: "Annuler",
	update: "Mettre à jour",
	play: "Écouter",
	playAll: "Tout Jouer",
	done: "OK",
	edit: "Changer",
	delete: "Supprimer",
	shuffle: "Aléatoire",
	libraries: "Bibliothèques",
	interface: "Interface",
	home: "Accueil",
	create: "Créer",
	playlists: en.playlists,
	playlist: "File d'attente",
	linkCopied: "Lien copié dans le presse-papier",
	newlyAddedAlbums: "Ajoutés Récemment",
	latestAlbums: "Dernières Sorties",
	newlyAddedArtists: "Artists Ajoutés Récemment",
	newlyAddedReleases: "Disques Ajoutés Récemment",
	mostPlayedSongs: "Les Plus Joués",
	errorOccured: "Oups... Une erreur est survenue",
	pageNotFound: "Oups... Lien invalide",
	users: "Comptes",
	lyrics: "Paroles",
	versions: "Versions",
	tracks: "Pistes",
	genres: en.genres,
	externalLinks: "Liens Externes",
	disc: "Disque",
	otherAlbumReleases: "Autres disques du même album",
	musicVideos: "Clips Vidéos",
	playlistReorderSuccess: "Playlist mise à jour!",
	playlistReorderFail: "Echec de la mise à jour de la playlist",
	topSongs: "Meilleurs Titres",
	topVideos: "Meilleurs Clips Vidéos",
	albums: en.albums,
	seeAll: "Voir Plus",
	trackInformation: "Données de la piste",
	name: "Nom",
	playCount: "Nombre de lectures",
	duration: "Durée",
	bitRate: "Bitrate",
	type: "Type",
	extension: "Extension",
	path: "Chemin",
	registrationDate: "Date d'ajout",

	nameOfLibrary: "Nom de la bibliothèque",
	nameIsRequired: "Le nom est obligatoire",
	pathOfLibrary: "Chemin de la bibliothèque",
	pathIsRequired: "Le chemin est obligatoire",
	goBackHome: "Retour à l'accueil",
	noLyricsFound: "Aucune Parole Trouvée",

	warning: "Attention",
	downloadWarning:
		"Il est interdit de télécharger du contenu sans en posséder l'original. Ne téléchagez pas si vous ne le posséder pas légalement.",
	download: "Télécharger",

	compilation: "Compilation",
	libraryDeleted: "Bibliothèque Supprimée",
	libraryDeletionFail: "Echec de l'effacement de la Bibliothèque",
	libraryCreated: "Bibliothèque créée",
	libraryCreationFail: "Echec de la création de la Bibliothèque",
	libraryUpdated: "Bibliothèque mise à jour",
	clean: "Nettoyer",
	refresh: "Rafraichir",
	scan: "Scanner",
	refreshMetadata: "Rafraichir les métadonnées",
	createLibrary: "Créer une Bibliothèque",
	deleteLibrary: "Supprimer la Bibliothèque",
	deleteLibraryAction: "Supprimer une Bibliothèque",
	deleteLibraryWarning:
		"Vous êtes sur le point de supprimer une bibliothèque. Il sera impossible de revenir en arrière.",

	deleteUser: "Supprimer Compte",
	deleteUserWarning:
		"Vous allez supprimer un compte utilisateur. Cela ne pourra pas être annulé.",
	userDeleted: "Compte Supprimé",
	userDeletionFail: "Echec de la suppression du compte",
	userUpdateFail: "Echec de la mise à jour de l'utilisateur",
	userNowEnabled: "Le compte utilisateur est activé",
	userNowDisabled: "Le compte utilisateur est desactivé",
	userNowAdmin: "L'utilisateur est maintenant administrateur",
	userNowNotAdmin: "L'utilisateur n'est plus administrateur",
	you: "Vous",
	admin: "Administrateur",
	enabled: "Activé",

	All: "Tous Types",
	StudioRecording: "Album Studio",
	Single: "Single",
	LiveRecording: "Album Live",
	Compilation: "Compilation",
	Soundtrack: "Bande Originale",
	RemixAlbum: "Album de Remixes",
	VideoAlbum: "Collection de Vidéos",
	pluralStudioRecording: "Albums",
	pluralSingle: "Singles",
	pluralLiveRecording: "Albums Live",
	pluralCompilation: "Compilations",
	pluralSoundtrack: "Bandes Originales",
	pluralRemixAlbum: "Remixes",
	pluralVideoAlbum: "Albums Vidéos",

	backToTop: "Retour en haut",
	changeLayout: "Changer la disposition",

	changeAlbumType: "Changer le Type de l'Album",
	onThisAlbum: "Artistes Invités",

	sortBy: "Trier par",
	order: "Ordre",
	asc: "Asc",
	desc: "Desc",
	artistName: "Nom d'Artiste",
	releaseDate: "Date de Sortie",
	addDate: "Date d'Ajout",
	albumCount: "Nombre d'Albums",
	trackCount: "Nombre de Pistes",
	songCount: "Nombre de Titres",
	entryCount: "Nombre de Titres",
	creationDate: "Date de création",
	releaseName: "Nom de Disque",
	bitrate: "Bitrate",
	trackIndex: "Index de piste",
	discIndex: "Index de disque",
	artist: "Artiste",
	artists: "Artistes",
	album: "Album",
	songs: "Morceaux",
	song: "Titre",
	search: "Rechercher",
	settings: "Préférences",
	playlistItemDeletionSuccess: "Piste supprimée",
	videos: "Vidéos",
	trackSetAsMaster: "Piste devenue Principale",
	allLibraries: "Toutes librairies",
	setAsMaster: "Promouvoir",
	setAllTracksAsMaster: "Promouvoir toutes les pistes",
	deleteFromPlaylist: "Supprimer de la playlist",
	releaseSetAsMaster: "Disque Promu",
	tracksUpdated: "Pistes mises à jour",
	librariesLoadFail: "echec du chargement des bibliothèqyes",
	username: "Nom d'Utilisateur",
	password: "Mot de passe",
	confirmPassword: "Confirmez le mot de passe",
	pleaseConfirm: "Confirmez le mot de passe",
	passwordsAreDifferent: "Les mots de passes sont différents",
	signupButton: "Nouveau ici? Inscrivez-vous",
	signinButton: "On s'est déjà vu? Connectez-voud",
	usernameIsRequired: "Un nom d'utilisateur est attendu",
	passwordIsRequired: "Un mot de passe est attendu",
	usernameTooShort: "Le nom d'utilisateur est trop court",
	passwordTooShort: "Le mot de passe est trop court",
	accountCreated:
		"Votre compte a été créé. Contactez l'administrateur pour qu'il l'active.",
	changeIllutration: "Changer l'illustration",
	moreInfo: "Voir les Informations",
	share: "Partager",
	playNext: "Lire Ensuite",
	playAfter: "Lire Après",
	new: "Nouveau",
	addToPlaylist: "Ajouter à une Playlist",
	seeLyrics: "Voir les Paroles",
	goToArtist: "Voir l'Artiste",
	seeAlbums: "Voir les Albums",
	seeSongs: "Voir les Morceaux",
	goToAlbum: "Voir l'Album",
	seeReleases: "Voir les Disques",
	seeOtherVersions: "Voir les versions",
	seeRelatedTracks: "Voir les pistes",
	scanLibraries: "Scanner les Bibliothèques",
	cleanLibraries: "Nettoyer les Bibliothèques",
	fetchMetadata: "Récupérer les Métadonnées",
	switchToDefaultLng: "Langue par Défaut",
	archive: "Archiver",
	lightMode: "Thème Clair",
	darkMode: "Thème Sombre",
	autoMode: "Thème Automatique",
	logout: "Se Déconnecter",

	appearsOn: "Apparaît sur",
	featuredOnPlaylists: "Apparaît dans",
	bonusTracks: "Pistes Bonus",
	relatedAlbums: "Albums Associés",
	changeSongType: "Changer le type",

	Original: "Version Originale",
	Remix: "Remix",
	Live: "Version Live",
	Acoustic: "Version Acoustique",
	Instrumental: "Version Instrumentale",
	Edit: "Version Courte",
	Clean: "Version Clean",
	Demo: "Maquette",
	Unknown: "Type Inconnu",
	Acapella: "Acapella",

	refreshMetadataStarted:
		"Mise à jour des métadonées... (Rechargez la page pour actualiser)",
	refreshMetadataFailed: "Oups... La mise à jour des données a échoué.",
	more: "Plus",
	networkError: "La connexion au serveur a échoué...",
	playbackError: "Format non supporté par le navigateur. Piste ignorée.",
	about: "A Propos",
	showMore: "Afficher Plus",
	showLess: "Afficher Moins",
	tasks: "Tâches",
	current: "En cours",
	pending: "En attente",
	none: "Aucune",
	bonusTrack: "Piste Bonus",
	extras: "Extras",
	NonMusic: "Non Musical",
	colorScheme: "Thème",
	useSystemeTheme: "Utiliser le thème système",
	useDarkTheme: "Utiliser le mode sombre",
	language: "Langue",
	useSystemeLanguage: "Utiliser la langue du système",
	notifications: "Notifications",
	permissions: "Permissions",
	notifyOnTrackChange: "Notifier quand le morceau change",

	en: "Anglais",
	fr: "Français",
	featuredAlbums: "En Vedette",
};

export default fr;
