# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.3.1](https://github.com/differentialhq/differential/compare/v3.3.0...v3.3.1) (2023-12-30)


### Bug Fixes

* Add function execution time param ([ab67932](https://github.com/differentialhq/differential/commit/ab679328b06ac3a9761e2b76d115525719ff7615))


### Features

* Adding load testing improvements ([#32](https://github.com/differentialhq/differential/issues/32)) ([7427f88](https://github.com/differentialhq/differential/commit/7427f88e0ec84bac6562dc2c23da22e2c4dd7f99))
* Render execution time in admin ([#31](https://github.com/differentialhq/differential/issues/31)) ([c3c1d31](https://github.com/differentialhq/differential/commit/c3c1d316d7becc44d5e180ab388d8b11e49fb597)), closes [#28](https://github.com/differentialhq/differential/issues/28)





# [3.3.0](https://github.com/differentialhq/differential/compare/v3.2.3...v3.3.0) (2023-12-30)


### Bug Fixes

* Render noDataMessage on cluster tables ([#27](https://github.com/differentialhq/differential/issues/27)) ([bccae6e](https://github.com/differentialhq/differential/commit/bccae6e4c90a623ea550b5eddb7b8ec33e65c2ad))


### Features

* Add columns to track job execution time ([#28](https://github.com/differentialhq/differential/issues/28)) ([83afd89](https://github.com/differentialhq/differential/commit/83afd893b0a7b2188d00c7d87e3b9f8376dbebbe)), closes [#29](https://github.com/differentialhq/differential/issues/29)
* Record function execution time ([#29](https://github.com/differentialhq/differential/issues/29)) ([6889495](https://github.com/differentialhq/differential/commit/68894954268babe6e826c6e0c507e17e066a6140)), closes [#28](https://github.com/differentialhq/differential/issues/28)





## [3.2.3](https://github.com/differentialhq/differential/compare/v3.2.2...v3.2.3) (2023-12-29)


### Bug Fixes

* Build typescript sdk before publishing ([410a22c](https://github.com/differentialhq/differential/commit/410a22c4678785e1649051e5849cc76d12c63db9))
* Shard jobs by the service name ([#26](https://github.com/differentialhq/differential/issues/26)) ([c4defa5](https://github.com/differentialhq/differential/commit/c4defa5d63119cc16fb0a1e01a5e7148aa043327))





## [3.2.2](https://github.com/differentialhq/differential/compare/v3.2.1...v3.2.2) (2023-12-29)


### Bug Fixes

* Remove extraneous dependencies ([56eeb7f](https://github.com/differentialhq/differential/commit/56eeb7f0b2bbc379c8cf16f3be13f5c81f9e4c50))


### Features

* Admin console provides better telemetry on clusters ([#17](https://github.com/differentialhq/differential/issues/17)) ([b96b809](https://github.com/differentialhq/differential/commit/b96b809db6e785354343c754d9fd59d16f499632))





## [3.2.1](https://github.com/differentialhq/differential/compare/v3.2.0...v3.2.1) (2023-12-28)


### Bug Fixes

* Allow endpoint to the control-plane to be configured ([b9b5559](https://github.com/differentialhq/differential/commit/b9b5559b16b105ce2b7c77ba40e120f71d51566b))





# [3.2.0](https://github.com/differentialhq/differential/compare/v3.1.4...v3.2.0) (2023-12-28)


### Bug Fixes

* add registry to the publish command ([f100c98](https://github.com/differentialhq/differential/commit/f100c9855e7c546c6665d7ba1866717aa0ddffbf))
* use workspace dependency rather than registry ([#14](https://github.com/differentialhq/differential/issues/14)) ([45d833e](https://github.com/differentialhq/differential/commit/45d833e13a1b359b5ec776d074da878762255b65))


### Features

* Admin console v1 ([#15](https://github.com/differentialhq/differential/issues/15)) ([9ec8db9](https://github.com/differentialhq/differential/commit/9ec8db9122a8d1de4fa6ad7f3965ec09871652cc))
* conventional commit validator ([#11](https://github.com/differentialhq/differential/issues/11)) ([7221156](https://github.com/differentialhq/differential/commit/7221156c4969e4c5da415c1774a5395cc08c77d8))





## [3.1.4](https://github.com/differentialhq/differential/compare/v3.1.3...v3.1.4) (2023-12-24)

**Note:** Version bump only for package root





## [3.1.3](https://github.com/differentialhq/differential/compare/v3.1.2...v3.1.3) (2023-12-24)

**Note:** Version bump only for package root





## [3.1.2](https://github.com/differentialhq/differential/compare/v3.1.1...v3.1.2) (2023-12-24)


### Bug Fixes

* Raise exception on unauthorised polling errors ([#7](https://github.com/differentialhq/differential/issues/7)) ([148eda7](https://github.com/differentialhq/differential/commit/148eda7aeda9bc7a44a9fa4e546d0ddc470fe2bf)), closes [#6](https://github.com/differentialhq/differential/issues/6)





## [3.1.1](https://github.com/differentialhq/differential/compare/v0.0.0...v3.1.1) (2023-12-24)


### Bug Fixes

* Adding a bin script ([e9f4a61](https://github.com/differentialhq/differential/commit/e9f4a61e1fc8fb75c85b14d9f21c5b1aee812be0))
* Adding the package name ([3338eba](https://github.com/differentialhq/differential/commit/3338ebaa7ab91ef9e5afb6acbe2967e90a4bd7a3))
* Allow all commit history for changelogs ([530f868](https://github.com/differentialhq/differential/commit/530f868db5dd6a6ece7aa803d14edf3206585195))
* Allow parallel function executions upto concurrency limit ([e431ff3](https://github.com/differentialhq/differential/commit/e431ff3cd41bce61a460e2bc89858d526c25df85))
* Allow services to start idempotently ([bf1c307](https://github.com/differentialhq/differential/commit/bf1c3079f1e8c4be56f9953a42c20e829397d8e1))
* **client:** Polling is now service specific. Each service can poll independently ([f7c160d](https://github.com/differentialhq/differential/commit/f7c160dca51b73fd2ed9a8d2eb2df1a96f02d5a0))
* Deprecate unused modules ([27394f4](https://github.com/differentialhq/differential/commit/27394f46aa1b752568db4250d0f29205fc3c3d67))
* Enforce service name param ([#5](https://github.com/differentialhq/differential/issues/5)) ([b0aadd7](https://github.com/differentialhq/differential/commit/b0aadd7e43a6c65b40d250c227ec906d65ee2320))
* Fix types to be more strict on call and background ([ec29dd2](https://github.com/differentialhq/differential/commit/ec29dd2d75a3e9a1a950f17e914ba8300d925333))
* **listeners:** Let listener params be optional ([eb24277](https://github.com/differentialhq/differential/commit/eb2427797213c61ecf95df6632290826aeefa1d9))
* Move differential-app out of the monorepo ([f1de61e](https://github.com/differentialhq/differential/commit/f1de61e714582980501764585f09b0968a223938))
* Remove executable from package.json ([8c3a8c5](https://github.com/differentialhq/differential/commit/8c3a8c5c98d61ba24311d0a9ae261fb2f759ddfc))
* Remove obsolete dependency ([2c81915](https://github.com/differentialhq/differential/commit/2c81915383dcafeed14961207d9ffee4dff99c84))
* Remove obsolete fly and listenerconfigs ([9ba1719](https://github.com/differentialhq/differential/commit/9ba171922a0160f20b557bf5c85631c2a549a15a))


### Features

* Adding changeset builder ([241b825](https://github.com/differentialhq/differential/commit/241b825aca4966a25f69f09c145cef57ec417838))
* Adding function support ([372b897](https://github.com/differentialhq/differential/commit/372b897dbad2ea3b871d6e5c0bdb28d121995cd8))
* Adding long polling support for control-plane ([98a6b69](https://github.com/differentialhq/differential/commit/98a6b69b340cfa67c3fa1759d0de9cfdf6c8f7ec))
* Initiall commit on the app ([3453496](https://github.com/differentialhq/differential/commit/34534961d59f28f62ff7d26597117cd26ac0c731))
* **sdk:** Add setConcurrency to dynamically change host concurrency ([fcbbd40](https://github.com/differentialhq/differential/commit/fcbbd401ec3aa0356aaf7e5b43d38d700c3974a4))
* Updating the docs to 3.0 ([732247b](https://github.com/differentialhq/differential/commit/732247b82975553f47d23d82f9b6fd1a7106e1a4))





# [](https://github.com/differentialhq/differential/compare/v0.0.0...v) (2023-12-24)


### Bug Fixes

* Adding a bin script ([e9f4a61](https://github.com/differentialhq/differential/commit/e9f4a61e1fc8fb75c85b14d9f21c5b1aee812be0))
* Adding the package name ([3338eba](https://github.com/differentialhq/differential/commit/3338ebaa7ab91ef9e5afb6acbe2967e90a4bd7a3))
* Allow all commit history for changelogs ([530f868](https://github.com/differentialhq/differential/commit/530f868db5dd6a6ece7aa803d14edf3206585195))
* Allow parallel function executions upto concurrency limit ([e431ff3](https://github.com/differentialhq/differential/commit/e431ff3cd41bce61a460e2bc89858d526c25df85))
* Allow services to start idempotently ([bf1c307](https://github.com/differentialhq/differential/commit/bf1c3079f1e8c4be56f9953a42c20e829397d8e1))
* **client:** Polling is now service specific. Each service can poll independently ([f7c160d](https://github.com/differentialhq/differential/commit/f7c160dca51b73fd2ed9a8d2eb2df1a96f02d5a0))
* Deprecate unused modules ([27394f4](https://github.com/differentialhq/differential/commit/27394f46aa1b752568db4250d0f29205fc3c3d67))
* Enforce service name param ([#5](https://github.com/differentialhq/differential/issues/5)) ([b0aadd7](https://github.com/differentialhq/differential/commit/b0aadd7e43a6c65b40d250c227ec906d65ee2320))
* Fix types to be more strict on call and background ([ec29dd2](https://github.com/differentialhq/differential/commit/ec29dd2d75a3e9a1a950f17e914ba8300d925333))
* **listeners:** Let listener params be optional ([eb24277](https://github.com/differentialhq/differential/commit/eb2427797213c61ecf95df6632290826aeefa1d9))
* Move differential-app out of the monorepo ([f1de61e](https://github.com/differentialhq/differential/commit/f1de61e714582980501764585f09b0968a223938))
* Remove executable from package.json ([8c3a8c5](https://github.com/differentialhq/differential/commit/8c3a8c5c98d61ba24311d0a9ae261fb2f759ddfc))
* Remove obsolete dependency ([2c81915](https://github.com/differentialhq/differential/commit/2c81915383dcafeed14961207d9ffee4dff99c84))
* Remove obsolete fly and listenerconfigs ([9ba1719](https://github.com/differentialhq/differential/commit/9ba171922a0160f20b557bf5c85631c2a549a15a))


### Features

* Adding changeset builder ([241b825](https://github.com/differentialhq/differential/commit/241b825aca4966a25f69f09c145cef57ec417838))
* Adding function support ([372b897](https://github.com/differentialhq/differential/commit/372b897dbad2ea3b871d6e5c0bdb28d121995cd8))
* Adding long polling support for control-plane ([98a6b69](https://github.com/differentialhq/differential/commit/98a6b69b340cfa67c3fa1759d0de9cfdf6c8f7ec))
* Initiall commit on the app ([3453496](https://github.com/differentialhq/differential/commit/34534961d59f28f62ff7d26597117cd26ac0c731))
* **sdk:** Add setConcurrency to dynamically change host concurrency ([fcbbd40](https://github.com/differentialhq/differential/commit/fcbbd401ec3aa0356aaf7e5b43d38d700c3974a4))
* Updating the docs to 3.0 ([732247b](https://github.com/differentialhq/differential/commit/732247b82975553f47d23d82f9b6fd1a7106e1a4))



# 0.0.0 (2023-08-25)
