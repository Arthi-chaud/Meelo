# Meelo's Featuring Artist Management

Meelo is now able to parse and recognise featuring artists on a song, based on:

- Its name
- Its artist field (from the metadata)

It does not leverage the album artist.

For example, a song named 'My Song (feat. Another Artist)' by 'Primary Artist & Other Artist' would be parsed to 'My Song' by artist 'Primary artist', featuring 'Other Artist' and 'Another Artist'.

Therefore, each featuring artist will be added to the database, and treated like any other artist.

Parsing works with `()`, `[]` and `-` as delimiters.

## Examples

In this section, we list examples that would be successfully parsed by Meelo

- 'My Song (feat. B)' by 'A'
  - Name: 'My Song'
  - Artist: 'A'
  - Featuring: 'B'
- 'My Song (Remix) [feat. B]' by 'A'
  - Name: 'My Song (Remix)'
  - Artist: 'A'
  - Featuring: 'B'
- 'My Song' by 'A & B'
  - Name: 'My Song'
  - Artist: 'A'
  - Featuring: 'B'
- 'My Song' by 'A, B & C'
  - Name: 'My Song'
  - Artist: 'A'
  - Featuring: 'B', 'C'
- 'My Song - With D' by 'A, B & C'
  - Name: 'My Song'
  - Artist: 'A'
  - Featuring: 'B', 'C', 'D'
- 'My Song - Version With Drums' by 'A'
  - Name: 'My Song - Version With Drums'
  - Artist: 'A'
  - Featuring: None

## Special Case: Artist is already known

By default, we use '&' to find and split a list of artist. However, this behaviour changes if an artist containing '&' already exists.

For example, if we had an *album* artist named 'A & B' (since album artist are not parsed as much as song artists), a song named 'My Song (feat. A & B)' would be parsed as 'My Song', with featuring artist 'A & B'.
