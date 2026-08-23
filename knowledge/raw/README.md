# Raw sources

Immutable inputs. Do not rewrite history here.

**Medical cutpoints do not live in this folder.** Versioned, cited ranges
belong in `/data/reference-ranges` and `/data/population-stats`, with the
trust order and band policy in [`data/SOURCES.md`](../../data/SOURCES.md).
Duplicating numbers here would drift from the data layer.

What does belong:

- Pattern notes and product-memory sources that are not code
- Pointers to durable URLs (guidelines, lab catalogs, architecture posts)
- Quotes we might compile into `/knowledge/wiki`

Agents compile `raw/` + `data/` into wiki pages. The wiki is allowed to
change; raw notes and `data/` citations should stay stable.
