CREATE VIEW "track_illustrations_view" AS
SELECT
  i.*,
  t.id as "trackId"
FROM tracks t
	JOIN releases r ON r.id = t."releaseId"
	JOIN LATERAL
		(select "illustrationId" from release_illustrations ri
		where ri."releaseId" = r."id"
		AND (((ri.disc = t."discIndex") AND (ri.track = t."trackIndex"))
        OR ((ri.disc = t."discIndex") AND (ri.track IS NULL))
        OR ((ri.disc IS NULL) AND (ri.track IS NULL)))
        ORDER BY disc ASC NULLS LAST, track NULLS LAST LIMIT 1)
		as ri ON TRUE
	JOIN illustrations i on i.id = ri."illustrationId";

CREATE VIEW "release_illustrations_view" AS
SELECT
  i.*,
  r.id as "releaseId"
FROM
	releases r
	JOIN LATERAL
		(SELECT "illustrationId" from release_illustrations ri
		where ri."releaseId" = r."id" AND ri.track IS NULL
		ORDER BY ri.disc ASC NULLS FIRST LIMIT 1) as
		ri ON TRUE
	JOIN illustrations i on i.id = ri."illustrationId";

CREATE VIEW "album_illustrations_view" AS
SELECT
  i.*,
  a.id as "albumId"
FROM
	albums a
	JOIN LATERAL
	(SELECT id
		from releases
		where (id = a."masterId") OR ("albumId" = a.id)
		ORDER BY "releaseDate" ASC NULLS LAST LIMIT 1
	) r ON TRUE
	JOIN release_illustrations_view ri on ri."releaseId" = COALESCE(a."masterId", r.id)
	JOIN illustrations i on i.id = ri.id;

CREATE VIEW "song_illustrations_view" AS
SELECT
  i.*,
  s.id as "songId"
FROM
	songs s
	JOIN LATERAL
	(SELECT id
		from tracks
		where (id = s."masterId") OR ("songId" = s.id)
		ORDER BY bitrate DESC NULLS LAST LIMIT 1
	) t ON TRUE
	JOIN track_illustrations_view ti on ti."trackId" = COALESCE(s."masterId", t.id)
	JOIN illustrations i on i.id = ti.id;