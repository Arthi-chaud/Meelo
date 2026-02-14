CREATE OR REPLACE VIEW "track_illustrations_view" AS
SELECT
  i.*,
  t.id as "trackId"
FROM tracks t
	JOIN releases r ON r.id = t."releaseId"
	JOIN LATERAL
		(select "illustrationId" from release_illustrations ri
		where ri."releaseId" = r."id"
		AND (((ri.disc is not distinct from t."discIndex") AND (ri.track is not distinct from t."trackIndex"))
        OR ((ri.disc is not distinct from t."discIndex") AND (ri.track IS NULL))
        OR ((ri.disc IS NULL) AND (ri.track IS NULL)))
        ORDER BY track NULLS LAST, disc ASC NULLS LAST LIMIT 1)
		as ri ON TRUE
	JOIN illustrations i on i.id = ri."illustrationId";
