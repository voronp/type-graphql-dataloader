# Changelog

All notable changes to this package are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

This is a fork of [voronp/type-graphql-dataloader](https://github.com/voronp/type-graphql-dataloader)
maintained by [ISoft Data Systems](https://github.com/ISoft-Data-Systems). Versions below `0.6.0`
were not tagged in this fork; entries starting at `0.6.0` are the first releases published from here.

## [0.6.3] - 2026-08-20

### Fixed

- Rebuilt `dist/` — the published `0.6.2` build was stale and still imported the removed
  `uuid` package in `ApolloServerLoaderPlugin.js`, causing `Cannot find module 'uuid'`
  at runtime for consumers of that file.

## [0.6.2] - 2026-08-20

### Changed

- Replaced the `uuid` dependency with `@lukeed/uuid` — `uuid` dropped CJS support in recent
  majors, which broke consumers still on CommonJS/Jest tooling.

## [0.6.1] - 2025-12-30

### Fixed

- Bumped dependencies to clear vulnerabilities reported by `npm audit` (`rimraf`,
  `brace-expansion`, and others).

### Changed

- Upgraded the Express example to Express 5 and current `@apollo/server`.
- Made `typeorm` a peer dependency so the consuming project controls its version, instead of
  pinning an internal version that caused install conflicts.

## [0.6.0] - 2025-12-23

### Breaking

- Converted the project and examples to ESM (import styles, `lodash` usage, module resolution).
  Consumers on CommonJS will need to adapt their import setup.

### Changed

- Replaced `jest`/`ts-jest` with Node's built-in test runner — Jest's ESM support conflicted
  with the rest of the conversion.
- Modernized TypeORM usage in tests and examples: removed deprecated APIs, fixed nullable
  column/foreign key handling, and aligned entity imports with what current TypeORM expects.
- Introduced a barrel file for example entities to avoid circular imports under ESM.

### Fixed

- Fixed downstream typing issues with Apollo Server plugin context types caused by mixed
  ESM/CJS imports, including re-exporting `type-graphql` types it doesn't provide directly.
- Removed test side effects (an async listener running outside the test lifecycle) and a
  redundant seed operation that were causing flaky test runs.

### Docs

- Updated the README to describe what differs in this fork and corrected install instructions.

[0.6.3]: https://github.com/ISoft-Data-Systems/type-graphql-dataloader/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/ISoft-Data-Systems/type-graphql-dataloader/compare/v0.5.1...v0.6.2
[0.6.1]: https://github.com/ISoft-Data-Systems/type-graphql-dataloader/compare/v0.5.1...v0.6.1
[0.6.0]: https://github.com/ISoft-Data-Systems/type-graphql-dataloader/compare/v0.5.1...v0.6.0
