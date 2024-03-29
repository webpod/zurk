## [0.0.32](https://github.com/webpod/zurk/compare/v0.0.31...v0.0.32) (2024-03-26)

### Fixes & improvements
* perf: migrate from yarn to npm ([6c455a2](https://github.com/webpod/zurk/commit/6c455a20ff2503ec1a439e36d58480025ba1e878))

## [0.0.31](https://github.com/webpod/zurk/compare/v0.0.30...v0.0.31) (2024-03-17)

### Fixes & improvements
* fix: apply undefined-filter to `assign` ([1463ca8](https://github.com/webpod/zurk/commit/1463ca8bba2d6ff6bdeb82a8598d306150481990))

## [0.0.30](https://github.com/webpod/zurk/compare/undefined...v0.0.30) (2024-03-17)

### Fixes & improvements
* fix: set detached `false` for win32 by default ([4d4e3c0](https://github.com/webpod/zurk/commit/4d4e3c0f9759448247fd60dbaad8c1e3fe10511c))
* docs: formatting ([c907044](https://github.com/webpod/zurk/commit/c907044dd76be3da591574fab66baf9d1bfcf9a1))
* docs: md formatting ([04a65a4](https://github.com/webpod/zurk/commit/04a65a436b0aeb0b3be0af9c94556794deb56a2f))
* refactor: move cmd builder to utils ([60123a5](https://github.com/webpod/zurk/commit/60123a5ac1d6f5f71302c639fb1a3b877f7bb2f2))
* docs: provide minimal usage example ([ae22952](https://github.com/webpod/zurk/commit/ae2295244c90e929ca8f12d261bd27cbebcc66d1))
* docs(zurk): describe main concepts ([8a9442b](https://github.com/webpod/zurk/commit/8a9442b20a1e87d222712229c9522adefcaa3372))
* refactor: move cmd builder to utils ([e73bb7a](https://github.com/webpod/zurk/commit/e73bb7a36a6a513bf93fcc6d6ad0b929fa6b7514))
* perf(spawn): compose `normalize` and `invoke` ([4e07348](https://github.com/webpod/zurk/commit/4e0734825df6f03c8569943ad8d07e4e6f83e638))
* refactor: move ee subscriber to `spawn` layer ([c91ff33](https://github.com/webpod/zurk/commit/c91ff3334de0e044cdd9a1b660fb9166b03f38b9))
* refactor: define `TZurkOn` handlers ifaces ([86d19dd](https://github.com/webpod/zurk/commit/86d19dd5e57bf754d1126334fed1320604494015))
* refactor(spawn): remove `onStdout` and `onStderr` handlers in favor or `on('stdout', () => {...})` ([7950a6c](https://github.com/webpod/zurk/commit/7950a6c142ed90b6da455b1042f7008e26af1480))

### Features
* feat: introduce listeners map, rename `_ctx` to `ctx` ([616b091](https://github.com/webpod/zurk/commit/616b0913117496f1aec4dd26353270fdfdd30f11))
* feat: pass reason arg to internal abortController ([76441c5](https://github.com/webpod/zurk/commit/76441c5a70af0716013a18818f184854625a5d5b))
