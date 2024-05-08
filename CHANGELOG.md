# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.19.0](https://github.com/differentialhq/differential/compare/v3.18.1...v3.19.0) (2024-05-08)

### Bug Fixes

- Add cloudwatch log filtering permissions ([#205](https://github.com/differentialhq/differential/issues/205)) ([83389b0](https://github.com/differentialhq/differential/commit/83389b08242e2d56cdf9a811d27055ca6203bbc2))
- Add quick start to admin console ([#212](https://github.com/differentialhq/differential/issues/212)) ([62aa1c4](https://github.com/differentialhq/differential/commit/62aa1c48c5507317525b09fcebbd492f30b0d65d))
- Allow job exection with cluster tokens ([#211](https://github.com/differentialhq/differential/issues/211)) ([0fa70cf](https://github.com/differentialhq/differential/commit/0fa70cfbe5db3fc6e866f323ea7e68dfb15565b4))
- Correct the curl endpoint in console ([81eee36](https://github.com/differentialhq/differential/commit/81eee367c07c4926b1f07f328ffb96670edcd53c))
- Expose endpoint to store json schema ([#218](https://github.com/differentialhq/differential/issues/218)) ([81cc21a](https://github.com/differentialhq/differential/commit/81cc21a36b4fcba031915f95d0d211c5d99afa2f))
- Initial agent comms architecture ([#221](https://github.com/differentialhq/differential/issues/221)) ([52bf177](https://github.com/differentialhq/differential/commit/52bf1779a6e0bdb2957412fd1a3df6bdc8292dd8))
- Open cluster on the overview page ([199d692](https://github.com/differentialhq/differential/commit/199d69272ce67ae0b97011f78050f778b94fd8df))
- Persist result should respect the machine id ([#204](https://github.com/differentialhq/differential/issues/204)) ([35a1751](https://github.com/differentialhq/differential/commit/35a1751bb5aab05eb8fb147e3701819541d0e59a))
- Publish schema via CLI ([#220](https://github.com/differentialhq/differential/issues/220)) ([e3f46b9](https://github.com/differentialhq/differential/commit/e3f46b9ce091a9bc3563ac6c6fc94d2cc82cb4de))

### Features

- Add access points to the cluster ([#210](https://github.com/differentialhq/differential/issues/210)) ([827dc3a](https://github.com/differentialhq/differential/commit/827dc3a10dc8dc202a44ac849b0ff2de836be3ba))
- Add log filtering option ([#207](https://github.com/differentialhq/differential/issues/207)) ([d28e247](https://github.com/differentialhq/differential/commit/d28e247d4dae2bed4fe671d514433b89f944f9d0))
- Add stalled deployment test ([#217](https://github.com/differentialhq/differential/issues/217)) ([7de6f8d](https://github.com/differentialhq/differential/commit/7de6f8db2f947eb4e13873ecad2c4259b771a5fd))
- Add time selection to log query ([#206](https://github.com/differentialhq/differential/issues/206)) ([2be0f4d](https://github.com/differentialhq/differential/commit/2be0f4d03baef79d1350ca1c239946ebef0494fd))
- CLI context ([#213](https://github.com/differentialhq/differential/issues/213)) ([deee54f](https://github.com/differentialhq/differential/commit/deee54f4f00b1283444ffa576cf103b9685280a0))
- Implementing deduplication logic via Execution ID ([#203](https://github.com/differentialhq/differential/issues/203)) ([f81a120](https://github.com/differentialhq/differential/commit/f81a12081cde90eade76c6774b27725ecd28f3c2))
- Prompt demo UI and CLI command ([#222](https://github.com/differentialhq/differential/issues/222)) ([4cab4ca](https://github.com/differentialhq/differential/commit/4cab4ca32af2cffcc0190f91a1202bd31fee844e))
- Refactor IAM to use CF Service Role ([#209](https://github.com/differentialhq/differential/issues/209)) ([f50cf9b](https://github.com/differentialhq/differential/commit/f50cf9b9b7a949bccfa3ab6332d9578171845b48))

## [3.18.1](https://github.com/differentialhq/differential/compare/v3.18.0...v3.18.1) (2024-03-30)

### Bug Fixes

- Minor UX improvements to the CLI ([#201](https://github.com/differentialhq/differential/issues/201)) ([a9be753](https://github.com/differentialhq/differential/commit/a9be753bcddeab8994d0304e1808514fa98ed26f))
- Respond with a 401 for auth errors ([dedd266](https://github.com/differentialhq/differential/commit/dedd266d3a900e89ef37ce69d46c43f5b0ca16e4))

# [3.18.0](https://github.com/differentialhq/differential/compare/v3.17.0...v3.18.0) (2024-03-29)

### Bug Fixes

- Additional Lambda permissions ([#195](https://github.com/differentialhq/differential/issues/195)) ([fbeb35a](https://github.com/differentialhq/differential/commit/fbeb35a6688e836d0cb4b9da0d65f86d11ff96e1))
- Cache auth results in-memory ([#199](https://github.com/differentialhq/differential/issues/199)) ([504fd0e](https://github.com/differentialhq/differential/commit/504fd0e0d6e14583d84f0bc32a4b38bbbcd724c0))
- Consult the function call instead of the cluster for predictive retries ([#198](https://github.com/differentialhq/differential/issues/198)) ([9f81a0a](https://github.com/differentialhq/differential/commit/9f81a0a26fd487e22cc9eb8241d3eab80c4a44c1))
- Minor optimizations to decrease the job latencies ([#200](https://github.com/differentialhq/differential/issues/200)) ([743cb5f](https://github.com/differentialhq/differential/commit/743cb5fef49e5d1cf5ee127d54e6042323f57fcc))

### Features

- **cli:** REPL interface ([#190](https://github.com/differentialhq/differential/issues/190)) ([1fdecad](https://github.com/differentialhq/differential/commit/1fdecad9ec401940d62ffd8201f6a5b0ccf5c7de))
- Deploy command shortcut ([#196](https://github.com/differentialhq/differential/issues/196)) ([52a8231](https://github.com/differentialhq/differential/commit/52a8231fe2ee95fd846bc4d844f04962e1365609))
- Initial deployment log rendering ([#197](https://github.com/differentialhq/differential/issues/197)) ([99c0cb6](https://github.com/differentialhq/differential/commit/99c0cb615007cbd870cb3cd9cac49739a4fe63d6))

# [3.17.0](https://github.com/differentialhq/differential/compare/v3.16.0...v3.17.0) (2024-03-28)

### Bug Fixes

- Additional SNS error logging ([#186](https://github.com/differentialhq/differential/issues/186)) ([b7f730b](https://github.com/differentialhq/differential/commit/b7f730b3075ab80b156066bf6df7fd3af3a0b07f))
- Cleanup some console.logs ([#188](https://github.com/differentialhq/differential/issues/188)) ([45b9e6f](https://github.com/differentialhq/differential/commit/45b9e6fc3ac7fd3c6a46be8ee1e8e499c873dd6d))
- Minor fixes to admin console ([#193](https://github.com/differentialhq/differential/issues/193)) ([6a1e697](https://github.com/differentialhq/differential/commit/6a1e69740c648eca8069c8dd5456ac50aa96c8e6))

### Features

- Add CloudFormation IAM permissions ([#187](https://github.com/differentialhq/differential/issues/187)) ([1ddac77](https://github.com/differentialhq/differential/commit/1ddac7735d98777d99fb98a2047fc9f96c5dc336))
- Better charts for services ([#180](https://github.com/differentialhq/differential/issues/180)) ([607140e](https://github.com/differentialhq/differential/commit/607140e3148f4ad0f8bcbaf81a75222a271f98f1))
- Call configuration and docs ([#192](https://github.com/differentialhq/differential/issues/192)) ([f1d405a](https://github.com/differentialhq/differential/commit/f1d405a6f5614343816d1577f2ebbf56577a41ed))
- **control-plane:** Introduce structured logging ([#182](https://github.com/differentialhq/differential/issues/182)) ([aa27106](https://github.com/differentialhq/differential/commit/aa27106c203b56ebd32651514663e5c03ead0948))
- Defer deployment inactivation ([#185](https://github.com/differentialhq/differential/issues/185)) ([181f9dd](https://github.com/differentialhq/differential/commit/181f9dd2ad547838e3a450d6bb2ff8138b0240f6))
- Deployment event tracking ([#184](https://github.com/differentialhq/differential/issues/184)) ([05a2349](https://github.com/differentialhq/differential/commit/05a23495c10b08f1a1ef53526344f3420f5e626c))
- Retry config via call config ([#191](https://github.com/differentialhq/differential/issues/191)) ([b69f603](https://github.com/differentialhq/differential/commit/b69f6033a780d8bce6f00fb124ac841114ee7fdd))
- Validate environment variables on startup ([#178](https://github.com/differentialhq/differential/issues/178)) ([475f00b](https://github.com/differentialhq/differential/commit/475f00bf8c25d5bf1654ad0447a16437788f1d50))
- Wrap requests in logger context ([#183](https://github.com/differentialhq/differential/issues/183)) ([3b583ef](https://github.com/differentialhq/differential/commit/3b583efe33fc940d49b5407dccea9ddf419b2fce))

# [3.16.0](https://github.com/differentialhq/differential/compare/v3.15.0...v3.16.0) (2024-03-24)

### Bug Fixes

- Fix polling cycle race condition ([#181](https://github.com/differentialhq/differential/issues/181)) ([e51bc6f](https://github.com/differentialhq/differential/commit/e51bc6fcefaa2f2a3fabfb5e789176fcee4926bb))

### Features

- Add FORCE_POLL_DELAY to ResultsPoller ([#177](https://github.com/differentialhq/differential/issues/177)) ([9bf1407](https://github.com/differentialhq/differential/commit/9bf14072bd41d06a52b16f225188f9b6f7cd7858))

# [3.15.0](https://github.com/differentialhq/differential/compare/v3.14.0...v3.15.0) (2024-03-23)

### Bug Fixes

- Add job duration metrics ([#157](https://github.com/differentialhq/differential/issues/157)) ([0bf7adf](https://github.com/differentialhq/differential/commit/0bf7adfc944ae14ac525fe9bf2fed93810493afb))
- Adding HTTP metrics ([#162](https://github.com/differentialhq/differential/issues/162)) ([6b9fda9](https://github.com/differentialhq/differential/commit/6b9fda97dbe4530cb4aefe7e5de110249342ea61))
- Cache predictive retries and better docs ([#171](https://github.com/differentialhq/differential/issues/171)) ([416a8ae](https://github.com/differentialhq/differential/commit/416a8aeaa5339491027cb4335b429789736f6ad4))
- Documentation updates based on feedback ([#166](https://github.com/differentialhq/differential/issues/166)) ([9553c42](https://github.com/differentialhq/differential/commit/9553c424049324f61da26b457ce973a1c81fafe5))
- Fix Dockerfile link ([907fbbe](https://github.com/differentialhq/differential/commit/907fbbee51018f8b03a250fd16099481c6057460))
- Fix jobId link for ClusterLiveTables ([#164](https://github.com/differentialhq/differential/issues/164)) ([ce1407c](https://github.com/differentialhq/differential/commit/ce1407c008b59f5b8b6d6b0c45d71b06446bcd0b))
- Implement longs polling for getJobStatuses ([#169](https://github.com/differentialhq/differential/issues/169)) ([289c7a0](https://github.com/differentialhq/differential/commit/289c7a0070e816243b5eb3b35a44f144f11f75b9))
- Infer getJobStatuses return type ([#173](https://github.com/differentialhq/differential/issues/173)) ([bfe099b](https://github.com/differentialhq/differential/commit/bfe099b68bf0f12455c7fb7cd768030c54cb7506))
- Minor fixes to failure modes and error handling docs ([1376bf6](https://github.com/differentialhq/differential/commit/1376bf615ae160eac95c21d5faeb48e6958c4e7c))
- Resolve test warnings ([#176](https://github.com/differentialhq/differential/issues/176)) ([e6c4d66](https://github.com/differentialhq/differential/commit/e6c4d66957bcbade2b064ae9ab9b4af389c97c8f))

### Features

- **admin:** Render deployment details ([#163](https://github.com/differentialhq/differential/issues/163)) ([7ba103d](https://github.com/differentialhq/differential/commit/7ba103d8641185e91df602974779ebde4f80e674))
- Client Library distribution ([#154](https://github.com/differentialhq/differential/issues/154)) ([4728199](https://github.com/differentialhq/differential/commit/472819901d0da46e61d8c4fdd9c894eacd99a74b))
- CloudFormation lambda provider ([#165](https://github.com/differentialhq/differential/issues/165)) ([9866a32](https://github.com/differentialhq/differential/commit/9866a32678f5c954852b84678395c3e6eebfd140))
- Gate cloud features ([#155](https://github.com/differentialhq/differential/issues/155)) ([41463e2](https://github.com/differentialhq/differential/commit/41463e24849d29de7fd52ee6e572aeedbe6128a7))
- Inject API secret into deployments ([#156](https://github.com/differentialhq/differential/issues/156)) ([6478816](https://github.com/differentialhq/differential/commit/64788163d705e8e65214a1f392dbba81feec4173))
- Update CloudFormation deployments based on SNS ([#167](https://github.com/differentialhq/differential/issues/167)) ([826b7d0](https://github.com/differentialhq/differential/commit/826b7d0885bcf2aeeb6115819c0805dc93f621c5))

# [3.14.0](https://github.com/differentialhq/differential/compare/v3.13.1...v3.14.0) (2024-02-29)

### Bug Fixes

- Add error catcher for isAlive call ([d78a768](https://github.com/differentialhq/differential/commit/d78a768ae03c303aae75a2748066412748f03c38))
- Auto-retry jobs when machine stalls ([#139](https://github.com/differentialhq/differential/issues/139)) ([7ceb438](https://github.com/differentialhq/differential/commit/7ceb438ec686d11709a027c6117c61c6380c56fb))
- Better navigation for admin console ([#145](https://github.com/differentialhq/differential/issues/145)) ([72ba17e](https://github.com/differentialhq/differential/commit/72ba17e6ad3ef4988a3fc6a7dbe8763b13fd9d37))

### Features

- Cleanup asset upload behaviour ([#148](https://github.com/differentialhq/differential/issues/148)) ([09746bc](https://github.com/differentialhq/differential/commit/09746bcd7ecff987324653f3db633bf1dae19ca5))
- **cli:** Add cluster management commands ([#133](https://github.com/differentialhq/differential/issues/133)) ([b1be567](https://github.com/differentialhq/differential/commit/b1be56720f66f0eef15bffcec28a8d7ba66b3192))
- **cli:** Allow arbitrary service name ([#137](https://github.com/differentialhq/differential/issues/137)) ([ce652e4](https://github.com/differentialhq/differential/commit/ce652e48bb7d207ae31728b52fbf34c2e456f54f))
- **cli:** Deployment list command ([#135](https://github.com/differentialhq/differential/issues/135)) ([0dc08df](https://github.com/differentialhq/differential/commit/0dc08dfdab9c69ec8a0c85a7b33264612f3821b8))
- Client library building ([#144](https://github.com/differentialhq/differential/issues/144)) ([ff2b103](https://github.com/differentialhq/differential/commit/ff2b103f2ba74271e8a2f5a7ad4a09146fc99ef4))
- Client library version increments ([#151](https://github.com/differentialhq/differential/issues/151)) ([435076c](https://github.com/differentialhq/differential/commit/435076c1d65201e00a90062f1cc3ed200b2c1385))
- Expose internal metrics to prometheus ([#146](https://github.com/differentialhq/differential/issues/146)) ([b504afb](https://github.com/differentialhq/differential/commit/b504afb4e4b2a7e69f47dfd0ee45221637c52ce7))
- Extended CLI token ([#136](https://github.com/differentialhq/differential/issues/136)) ([c035e46](https://github.com/differentialhq/differential/commit/c035e46ead280c3feaf42868daacbea5bc94332a))
- Service registration discovery ([#140](https://github.com/differentialhq/differential/issues/140)) ([dcfd29e](https://github.com/differentialhq/differential/commit/dcfd29efe3ded17bdf10c9d7785ca0190415bdc8))

### Reverts

- Revert "fix: Adding advisory locks to cron (#123)" ([eebb03e](https://github.com/differentialhq/differential/commit/eebb03e000dfda043ef02890d4d19652627cabff)), closes [#123](https://github.com/differentialhq/differential/issues/123)

## [3.13.1](https://github.com/differentialhq/differential/compare/v3.13.0...v3.13.1) (2024-02-15)

### Bug Fixes

- Polling with more efficiency ([#131](https://github.com/differentialhq/differential/issues/131)) ([f295aa7](https://github.com/differentialhq/differential/commit/f295aa7f1dd636b379f12cc3a30cfe4886b053cd))

# [3.13.0](https://github.com/differentialhq/differential/compare/v3.12.2...v3.13.0) (2024-02-15)

### Bug Fixes

- Clear CommonJS cache between invocations ([#128](https://github.com/differentialhq/differential/issues/128)) ([1fcb01d](https://github.com/differentialhq/differential/commit/1fcb01dc6ba0d60c039bd82e842021ff98bea27d)), closes [/github.com/differentialhq/differential/blob/main/cli/src/lib/package.ts#L200](https://github.com//github.com/differentialhq/differential/blob/main/cli/src/lib/package.ts/issues/L200)

### Features

- Add CLI auth flow ([#129](https://github.com/differentialhq/differential/issues/129)) ([9639761](https://github.com/differentialhq/differential/commit/963976147d5d3afd74a82a666378174ce8cfd009))
- **cli:** Use management token for authentication ([#130](https://github.com/differentialhq/differential/issues/130)) ([dbdd113](https://github.com/differentialhq/differential/commit/dbdd113567c8e6346458af49a3f4d0b93f13409c))
- disable lambda retries ([#127](https://github.com/differentialhq/differential/issues/127)) ([39f8635](https://github.com/differentialhq/differential/commit/39f863500e22b028b7976b3df0f9201de9d561fa))
- Get bulk job statuses endpoint ([#132](https://github.com/differentialhq/differential/issues/132)) ([af79fe4](https://github.com/differentialhq/differential/commit/af79fe475355386cbd0e2c99b05e7bc01e4ef3e3))

## [3.12.2](https://github.com/differentialhq/differential/compare/v3.12.1...v3.12.2) (2024-02-12)

### Bug Fixes

- Cleanup resource probes on PollingAgent abort ([#125](https://github.com/differentialhq/differential/issues/125)) ([bfc23ae](https://github.com/differentialhq/differential/commit/bfc23aedd9ad0f013f379771535aa587def8d8fb)), closes [/github.com/differentialhq/differential/blob/c43e67579b8a129faf9381a75a05fd50182fb050/ts-core/src/events.ts#L29](https://github.com//github.com/differentialhq/differential/blob/c43e67579b8a129faf9381a75a05fd50182fb050/ts-core/src/events.ts/issues/L29)
- **cli:** move detective to dependency ([#126](https://github.com/differentialhq/differential/issues/126)) ([6237d6f](https://github.com/differentialhq/differential/commit/6237d6fbb8d58566979ea42bf0977170dbfb387d))
- Refactor predictor mechanism, and update activity for predictor results. ([#122](https://github.com/differentialhq/differential/issues/122)) ([cca9465](https://github.com/differentialhq/differential/commit/cca94656decc553206e5bf5478ca5000c9aaa2bb))

## [3.12.1](https://github.com/differentialhq/differential/compare/v3.12.0...v3.12.1) (2024-02-12)

### Bug Fixes

- Add maxIdleCycles ([#113](https://github.com/differentialhq/differential/issues/113)) ([266fca0](https://github.com/differentialhq/differential/commit/266fca0fa34d7c9c9d0ce595b457191569f880d5))
- Adding advisory locks to cron ([#123](https://github.com/differentialhq/differential/issues/123)) ([ebf8b45](https://github.com/differentialhq/differential/commit/ebf8b45625d6b21a84ece0d299da1a3543a8673f))

# [3.12.0](https://github.com/differentialhq/differential/compare/v3.11.0...v3.12.0) (2024-02-11)

### Bug Fixes

- Keep one machine running to ([b25d8ad](https://github.com/differentialhq/differential/commit/b25d8ad6993a493c41fc45773d2c76a102cb1184))

### Features

- Adding interfaces to get and set cluster settings ([#119](https://github.com/differentialhq/differential/issues/119)) ([91c32cf](https://github.com/differentialhq/differential/commit/91c32cf115b5e20716a567c0d43608f860bd2d2d))
- Attach deployment to machine and events ([#124](https://github.com/differentialhq/differential/issues/124)) ([f9c0ce5](https://github.com/differentialhq/differential/commit/f9c0ce50e66fb50caf911c24ce5ade61d16bac8e))
- Initial deployment scheduling ([#121](https://github.com/differentialhq/differential/issues/121)) ([64a8c89](https://github.com/differentialhq/differential/commit/64a8c89c1b57f5e949e3d64c186893568b039937))
- Predictive retries toggle on console ([#120](https://github.com/differentialhq/differential/issues/120)) ([8ec586e](https://github.com/differentialhq/differential/commit/8ec586e37fe6538ac0386b2bd16db2c635cf0a26))

# [3.11.0](https://github.com/differentialhq/differential/compare/v3.10.1...v3.11.0) (2024-02-10)

### Bug Fixes

- Fix the control-plane build with include flag ([f95a751](https://github.com/differentialhq/differential/commit/f95a751625586bb8f44d0ebc125663ae79197d87))
- Predictive retries via self-heal mechanism ([#118](https://github.com/differentialhq/differential/issues/118)) ([d9dffe4](https://github.com/differentialhq/differential/commit/d9dffe432cef7857804a6a0c5994885319b11d63))

### Features

- Add management token for self hosting ([#100](https://github.com/differentialhq/differential/issues/100)) ([e0e8bf2](https://github.com/differentialhq/differential/commit/e0e8bf2a9126e170389a4afbe362016101aa064d))
- **cli:** Differential entrypoint ([#114](https://github.com/differentialhq/differential/issues/114)) ([bb3564c](https://github.com/differentialhq/differential/commit/bb3564ce4bbfaa6654663063acc5419df3b55a62))
- **cli:** Release deployments ([#110](https://github.com/differentialhq/differential/issues/110)) ([f016193](https://github.com/differentialhq/differential/commit/f016193d653ab8625df8af8ca915cef4137c6cce))
- Deployment publishing scaffolding ([#105](https://github.com/differentialhq/differential/issues/105)) ([a5a4ab1](https://github.com/differentialhq/differential/commit/a5a4ab1961bfadf7d3c9dcc7c6989d55ccc2ec26)), closes [#2](https://github.com/differentialhq/differential/issues/2)
- Deployment triggering ([#116](https://github.com/differentialhq/differential/issues/116)) ([509522c](https://github.com/differentialhq/differential/commit/509522cb81fa5ef4c66f9c38773d3517249dc834))
- Initial LambdaProvider ([#106](https://github.com/differentialhq/differential/issues/106)) ([7215f70](https://github.com/differentialhq/differential/commit/7215f7089742f0a2c4e56acf1957998eec568479)), closes [#105](https://github.com/differentialhq/differential/issues/105)
- Retry predictions for function rejections ([#109](https://github.com/differentialhq/differential/issues/109)) ([9dbf4d4](https://github.com/differentialhq/differential/commit/9dbf4d4bffe81bcf861366a080a0e0236b436c63))
- Service compilation and upload ([#88](https://github.com/differentialhq/differential/issues/88)) ([5f0e069](https://github.com/differentialhq/differential/commit/5f0e069bd59932cfb3f18e83202fed9250db8aa7))

## [3.10.1](https://github.com/differentialhq/differential/compare/v3.10.0...v3.10.1) (2024-01-31)

### Bug Fixes

- Throttle polling to recover from server failures ([#98](https://github.com/differentialhq/differential/issues/98)) ([865de2a](https://github.com/differentialhq/differential/commit/865de2a6135ab35b58266cb312dea31e45642436))

# [3.10.0](https://github.com/differentialhq/differential/compare/v3.9.0...v3.10.0) (2024-01-31)

### Bug Fixes

- A more readable e2e caching test ([#94](https://github.com/differentialhq/differential/issues/94)) ([ceef93f](https://github.com/differentialhq/differential/commit/ceef93f1050e63b573087881bf51f8b088124577))
- Change metrics storage to postgres ([#95](https://github.com/differentialhq/differential/issues/95)) ([048207c](https://github.com/differentialhq/differential/commit/048207cc209c32e99e22659f0742fab482f65b3f))
- Convert writing events to a raw query ([#99](https://github.com/differentialhq/differential/issues/99)) ([627c8b9](https://github.com/differentialhq/differential/commit/627c8b9e0947d5e3915411402eafdb30a80b4770))
- Fix serializing unregistered function errors ([#96](https://github.com/differentialhq/differential/issues/96)) ([f844184](https://github.com/differentialhq/differential/commit/f844184d4fe71e25ddb7f23b90caac0063720b54))

### Features

- Adding the retryable function decorator ([#91](https://github.com/differentialhq/differential/issues/91)) ([5992e1c](https://github.com/differentialhq/differential/commit/5992e1cb2bcb45785db792418b9e1ffdc0871edf))

# [3.9.0](https://github.com/differentialhq/differential/compare/v3.8.0...v3.9.0) (2024-01-25)

### Bug Fixes

- Expose `cached` in the SDK and fix control-plane to respect the decorator ([#86](https://github.com/differentialhq/differential/issues/86)) ([07897cb](https://github.com/differentialhq/differential/commit/07897cb1acbc995a1eff8510ccd9855bc2ec85ab))
- Fix caching test timeouts ([#93](https://github.com/differentialhq/differential/issues/93)) ([1e39e9a](https://github.com/differentialhq/differential/commit/1e39e9a37ac05249917d027e900f2033d0db20c1))
- Fix control plane to respect the `cacheKey` ([#87](https://github.com/differentialhq/differential/issues/87)) ([babb20f](https://github.com/differentialhq/differential/commit/babb20f120933aabdf75674be8271f80fdef83ef))
- Minor styling updates ([#85](https://github.com/differentialhq/differential/issues/85)) ([9de6842](https://github.com/differentialhq/differential/commit/9de6842222a686ea0758cac7f79ca078c9eacad1))
- Parse service defintions correctly on the console ([041b02a](https://github.com/differentialhq/differential/commit/041b02a57152f0a64d3a19ea67107b4058278d7f))

### Features

- Add caching ([#81](https://github.com/differentialhq/differential/issues/81)) ([c654700](https://github.com/differentialhq/differential/commit/c6547005cb1ac59fef764f0a89e1b1c7fc390dd0))
- Implementing retries for job stalling ([#90](https://github.com/differentialhq/differential/issues/90)) ([c201765](https://github.com/differentialhq/differential/commit/c201765482e5e2d2394bd53406a5628fa37382ef))

# [3.8.0](https://github.com/differentialhq/differential/compare/v3.7.1...v3.8.0) (2024-01-18)

### Bug Fixes

- Fix job poll timer initialization ([#82](https://github.com/differentialhq/differential/issues/82)) ([de383d6](https://github.com/differentialhq/differential/commit/de383d63a5f62654975cade8476fa7f07aaa9ff8))
- Fix the husky command on console ([366a26e](https://github.com/differentialhq/differential/commit/366a26efd46fcaf07ecb842ee71de802a9b160ba))
- Update cluster definition ([449ba0a](https://github.com/differentialhq/differential/commit/449ba0aca92a593d28ef54537fb6acb88cd90805))
- Use getToken for retrieving auth token ([#74](https://github.com/differentialhq/differential/issues/74)) ([ea13436](https://github.com/differentialhq/differential/commit/ea134363fadbca552870d1c27778e4e836bff23e)), closes [#72](https://github.com/differentialhq/differential/issues/72)

### Features

- Activity log for jobs ([#80](https://github.com/differentialhq/differential/issues/80)) ([9bd3bd7](https://github.com/differentialhq/differential/commit/9bd3bd73dd8abeae95784abc4520c97ecb605b0d))
- Adding cluster activity ([#73](https://github.com/differentialhq/differential/issues/73)) ([f3b9545](https://github.com/differentialhq/differential/commit/f3b95457a2dae93e653516d2c3dc74202a2a4f84))
- Display average execution ([#79](https://github.com/differentialhq/differential/issues/79)) ([ba714cb](https://github.com/differentialhq/differential/commit/ba714cb21871b9e13445b3bb7e5590ccdd03870a))
- Publish client metrics to control plane ([#69](https://github.com/differentialhq/differential/issues/69)) ([b7b1e74](https://github.com/differentialhq/differential/commit/b7b1e74cdaaaa54de622591dafa0273bcc994f26)), closes [#68](https://github.com/differentialhq/differential/issues/68)
- Render failure rate for request count ([#78](https://github.com/differentialhq/differential/issues/78)) ([a556217](https://github.com/differentialhq/differential/commit/a5562174fab2c7529769da64817e2ba8a460239f))
- Request count graph ([#72](https://github.com/differentialhq/differential/issues/72)) ([ba67a37](https://github.com/differentialhq/differential/commit/ba67a3746da21d579c47cd567cf83c290ddcea54)), closes [#71](https://github.com/differentialhq/differential/issues/71)
- Return metrics as time series array ([#71](https://github.com/differentialhq/differential/issues/71)) ([ed6c362](https://github.com/differentialhq/differential/commit/ed6c3622f894acb5956936a53c51ddcda8d6ae8f)), closes [#72](https://github.com/differentialhq/differential/issues/72)
- Write job activity to influxdb ([#75](https://github.com/differentialhq/differential/issues/75)) ([93b9648](https://github.com/differentialhq/differential/commit/93b96482144d91d3cb22387b18b63c1ad5830852))

## [3.7.1](https://github.com/differentialhq/differential/compare/v3.7.0...v3.7.1) (2024-01-13)

### Bug Fixes

- Add initiate profiler on startup ([1e84624](https://github.com/differentialhq/differential/commit/1e846246e20d176cbca20cc3b86b0c78d196feaf))
- Close handle on cron ([#58](https://github.com/differentialhq/differential/issues/58)) ([87d29ca](https://github.com/differentialhq/differential/commit/87d29ca27b0d6fa0dd12aa2b67a604f9b0bf2664))
- Improve polling and shutdown stability ([#62](https://github.com/differentialhq/differential/issues/62)) ([db017d6](https://github.com/differentialhq/differential/commit/db017d677b5133496647bcefc471a06fac2fd447))
- Reduce open handles ([#57](https://github.com/differentialhq/differential/issues/57)) ([0dbf051](https://github.com/differentialhq/differential/commit/0dbf051d689b285b80229ce0053c5b8f4452d63b))
- Remove the deprecated services object ([07206ac](https://github.com/differentialhq/differential/commit/07206ace86971d4873c3df90f76ac08b23b333a2))

### Features

- Client metric ingestion endpoint ([#68](https://github.com/differentialhq/differential/issues/68)) ([6b4c0ca](https://github.com/differentialhq/differential/commit/6b4c0caa094f03b6c5d47deaded5cb49c0f3b330)), closes [#69](https://github.com/differentialhq/differential/issues/69)
- Render service definition in front end ([#51](https://github.com/differentialhq/differential/issues/51)) ([a1bd0d4](https://github.com/differentialhq/differential/commit/a1bd0d402aec09a17ac63ae4708d6138ab2cd945)), closes [#47](https://github.com/differentialhq/differential/issues/47) [#43](https://github.com/differentialhq/differential/issues/43)

# [3.7.0](https://github.com/differentialhq/differential/compare/v3.6.1...v3.7.0) (2024-01-11)

### Bug Fixes

- Remove incorrect file import ([1b81f62](https://github.com/differentialhq/differential/commit/1b81f62fb6394ed111dd7e058b97fbc63e87e770))
- Send service definitions to control-plane ([#48](https://github.com/differentialhq/differential/issues/48)) ([3a17ee2](https://github.com/differentialhq/differential/commit/3a17ee2627f8964bee441372484070b62b0ace82))
- Test fixes ([#54](https://github.com/differentialhq/differential/issues/54)) ([1249b4f](https://github.com/differentialhq/differential/commit/1249b4f59a75019d057e0b58a25b7b128e8edbd7))
- Update contract with getFunctionMetrics ([ca663d8](https://github.com/differentialhq/differential/commit/ca663d8a057c67e6dee929e446c667176dbe6730))

### Features

- Allow polling wait time configuration ([#56](https://github.com/differentialhq/differential/issues/56)) ([689238b](https://github.com/differentialhq/differential/commit/689238b650e92ac67d375c2a7ff3c859939f6388))
- Initial service metrics with influx DB ([#43](https://github.com/differentialhq/differential/issues/43)) ([3652bac](https://github.com/differentialhq/differential/commit/3652bac2ce78a5f0e4beae68d2cb5604d2c1af22)), closes [/github.com/differentialhq/differential/blob/efea7b2eb62092c8591f53f81e2a1417514b7b34/control-plane/src/modules/influx.ts#L6](https://github.com//github.com/differentialhq/differential/blob/efea7b2eb62092c8591f53f81e2a1417514b7b34/control-plane/src/modules/influx.ts/issues/L6)
- Persist service definition ([#47](https://github.com/differentialhq/differential/issues/47)) ([bb822f7](https://github.com/differentialhq/differential/commit/bb822f7d46f7e3bd17da0ba279a9643ef7ea06d8))
- Register service definitions ([#55](https://github.com/differentialhq/differential/issues/55)) ([36d8b3f](https://github.com/differentialhq/differential/commit/36d8b3f45e43d79b96cf378b1b575b5696c8d47b))
- Seperate service view ([#46](https://github.com/differentialhq/differential/issues/46)) ([07682a1](https://github.com/differentialhq/differential/commit/07682a13ce2af8a536a1f7dde421bf2fd4ac7b16))

## [3.6.1](https://github.com/differentialhq/differential/compare/v3.6.0...v3.6.1) (2024-01-07)

### Bug Fixes

- Fix documentation on idempotency ([#45](https://github.com/differentialhq/differential/issues/45)) ([f735951](https://github.com/differentialhq/differential/commit/f735951c2bc97259e51122a3b328df205cced496))

# [3.6.0](https://github.com/differentialhq/differential/compare/v3.5.0...v3.6.0) (2024-01-07)

### Features

- Add `idempotent` utility ([#44](https://github.com/differentialhq/differential/issues/44)) ([8cc3b54](https://github.com/differentialhq/differential/commit/8cc3b54dd93f50e26306d9e1fd23a16804318498))

# [3.5.0](https://github.com/differentialhq/differential/compare/v3.4.6...v3.5.0) (2024-01-06)

### Bug Fixes

- Add updated contract to sdk ([4794d59](https://github.com/differentialhq/differential/commit/4794d59f6ecc3176da8244742e54e9be0339e488))

### Features

- Allow jobs to be called idempotently ([#42](https://github.com/differentialhq/differential/issues/42)) ([118e4b5](https://github.com/differentialhq/differential/commit/118e4b5e7a3141664c9b67e62856e7ba285f4937))

## [3.4.6](https://github.com/differentialhq/differential/compare/v3.4.5...v3.4.6) (2024-01-01)

### Features

- Function error rates and execution time ([#37](https://github.com/differentialhq/differential/issues/37)) ([44378c3](https://github.com/differentialhq/differential/commit/44378c3d785b94cf55734e8102c5fd7a1eed9f51))

## [3.4.5](https://github.com/differentialhq/differential/compare/v3.4.4...v3.4.5) (2024-01-01)

**Note:** Version bump only for package root

## [3.4.4](https://github.com/differentialhq/differential/compare/v3.4.3...v3.4.4) (2024-01-01)

**Note:** Version bump only for package root

## [3.4.3](https://github.com/differentialhq/differential/compare/v3.4.2...v3.4.3) (2024-01-01)

**Note:** Version bump only for package root

## [3.4.2](https://github.com/differentialhq/differential/compare/v3.4.1...v3.4.2) (2024-01-01)

**Note:** Version bump only for package root

## [3.4.1](https://github.com/differentialhq/differential/compare/v3.4.0...v3.4.1) (2023-12-31)

### Bug Fixes

- Fix formatting in the docs ([5db68f8](https://github.com/differentialhq/differential/commit/5db68f8691c43430aa0302eadae76e7ddf14f07a))

# [3.4.0](https://github.com/differentialhq/differential/compare/v3.3.1...v3.4.0) (2023-12-31)

### Features

- End to end encryption for payloads ([#36](https://github.com/differentialhq/differential/issues/36)) ([834651d](https://github.com/differentialhq/differential/commit/834651dc3170aff3c704d5518344c8ec98e6e3d3))
- Longer and configurable long polling intervals ([#35](https://github.com/differentialhq/differential/issues/35)) ([9495349](https://github.com/differentialhq/differential/commit/949534900a99cf18876363adce7df0dc27fa2c4f))

## [3.3.1](https://github.com/differentialhq/differential/compare/v3.3.0...v3.3.1) (2023-12-30)

### Bug Fixes

- Add function execution time param ([ab67932](https://github.com/differentialhq/differential/commit/ab679328b06ac3a9761e2b76d115525719ff7615))

### Features

- Adding load testing improvements ([#32](https://github.com/differentialhq/differential/issues/32)) ([7427f88](https://github.com/differentialhq/differential/commit/7427f88e0ec84bac6562dc2c23da22e2c4dd7f99))
- Render execution time in admin ([#31](https://github.com/differentialhq/differential/issues/31)) ([c3c1d31](https://github.com/differentialhq/differential/commit/c3c1d316d7becc44d5e180ab388d8b11e49fb597)), closes [#28](https://github.com/differentialhq/differential/issues/28)

# [3.3.0](https://github.com/differentialhq/differential/compare/v3.2.3...v3.3.0) (2023-12-30)

### Bug Fixes

- Render noDataMessage on cluster tables ([#27](https://github.com/differentialhq/differential/issues/27)) ([bccae6e](https://github.com/differentialhq/differential/commit/bccae6e4c90a623ea550b5eddb7b8ec33e65c2ad))

### Features

- Add columns to track job execution time ([#28](https://github.com/differentialhq/differential/issues/28)) ([83afd89](https://github.com/differentialhq/differential/commit/83afd893b0a7b2188d00c7d87e3b9f8376dbebbe)), closes [#29](https://github.com/differentialhq/differential/issues/29)
- Record function execution time ([#29](https://github.com/differentialhq/differential/issues/29)) ([6889495](https://github.com/differentialhq/differential/commit/68894954268babe6e826c6e0c507e17e066a6140)), closes [#28](https://github.com/differentialhq/differential/issues/28)

## [3.2.3](https://github.com/differentialhq/differential/compare/v3.2.2...v3.2.3) (2023-12-29)

### Bug Fixes

- Build typescript sdk before publishing ([410a22c](https://github.com/differentialhq/differential/commit/410a22c4678785e1649051e5849cc76d12c63db9))
- Shard jobs by the service name ([#26](https://github.com/differentialhq/differential/issues/26)) ([c4defa5](https://github.com/differentialhq/differential/commit/c4defa5d63119cc16fb0a1e01a5e7148aa043327))

## [3.2.2](https://github.com/differentialhq/differential/compare/v3.2.1...v3.2.2) (2023-12-29)

### Bug Fixes

- Remove extraneous dependencies ([56eeb7f](https://github.com/differentialhq/differential/commit/56eeb7f0b2bbc379c8cf16f3be13f5c81f9e4c50))

### Features

- Admin console provides better telemetry on clusters ([#17](https://github.com/differentialhq/differential/issues/17)) ([b96b809](https://github.com/differentialhq/differential/commit/b96b809db6e785354343c754d9fd59d16f499632))

## [3.2.1](https://github.com/differentialhq/differential/compare/v3.2.0...v3.2.1) (2023-12-28)

### Bug Fixes

- Allow endpoint to the control-plane to be configured ([b9b5559](https://github.com/differentialhq/differential/commit/b9b5559b16b105ce2b7c77ba40e120f71d51566b))

# [3.2.0](https://github.com/differentialhq/differential/compare/v3.1.4...v3.2.0) (2023-12-28)

### Bug Fixes

- add registry to the publish command ([f100c98](https://github.com/differentialhq/differential/commit/f100c9855e7c546c6665d7ba1866717aa0ddffbf))
- use workspace dependency rather than registry ([#14](https://github.com/differentialhq/differential/issues/14)) ([45d833e](https://github.com/differentialhq/differential/commit/45d833e13a1b359b5ec776d074da878762255b65))

### Features

- Admin console v1 ([#15](https://github.com/differentialhq/differential/issues/15)) ([9ec8db9](https://github.com/differentialhq/differential/commit/9ec8db9122a8d1de4fa6ad7f3965ec09871652cc))
- conventional commit validator ([#11](https://github.com/differentialhq/differential/issues/11)) ([7221156](https://github.com/differentialhq/differential/commit/7221156c4969e4c5da415c1774a5395cc08c77d8))

## [3.1.4](https://github.com/differentialhq/differential/compare/v3.1.3...v3.1.4) (2023-12-24)

**Note:** Version bump only for package root

## [3.1.3](https://github.com/differentialhq/differential/compare/v3.1.2...v3.1.3) (2023-12-24)

**Note:** Version bump only for package root

## [3.1.2](https://github.com/differentialhq/differential/compare/v3.1.1...v3.1.2) (2023-12-24)

### Bug Fixes

- Raise exception on unauthorised polling errors ([#7](https://github.com/differentialhq/differential/issues/7)) ([148eda7](https://github.com/differentialhq/differential/commit/148eda7aeda9bc7a44a9fa4e546d0ddc470fe2bf)), closes [#6](https://github.com/differentialhq/differential/issues/6)

## [3.1.1](https://github.com/differentialhq/differential/compare/v0.0.0...v3.1.1) (2023-12-24)

### Bug Fixes

- Adding a bin script ([e9f4a61](https://github.com/differentialhq/differential/commit/e9f4a61e1fc8fb75c85b14d9f21c5b1aee812be0))
- Adding the package name ([3338eba](https://github.com/differentialhq/differential/commit/3338ebaa7ab91ef9e5afb6acbe2967e90a4bd7a3))
- Allow all commit history for changelogs ([530f868](https://github.com/differentialhq/differential/commit/530f868db5dd6a6ece7aa803d14edf3206585195))
- Allow parallel function executions upto concurrency limit ([e431ff3](https://github.com/differentialhq/differential/commit/e431ff3cd41bce61a460e2bc89858d526c25df85))
- Allow services to start idempotently ([bf1c307](https://github.com/differentialhq/differential/commit/bf1c3079f1e8c4be56f9953a42c20e829397d8e1))
- **client:** Polling is now service specific. Each service can poll independently ([f7c160d](https://github.com/differentialhq/differential/commit/f7c160dca51b73fd2ed9a8d2eb2df1a96f02d5a0))
- Deprecate unused modules ([27394f4](https://github.com/differentialhq/differential/commit/27394f46aa1b752568db4250d0f29205fc3c3d67))
- Enforce service name param ([#5](https://github.com/differentialhq/differential/issues/5)) ([b0aadd7](https://github.com/differentialhq/differential/commit/b0aadd7e43a6c65b40d250c227ec906d65ee2320))
- Fix types to be more strict on call and background ([ec29dd2](https://github.com/differentialhq/differential/commit/ec29dd2d75a3e9a1a950f17e914ba8300d925333))
- **listeners:** Let listener params be optional ([eb24277](https://github.com/differentialhq/differential/commit/eb2427797213c61ecf95df6632290826aeefa1d9))
- Move differential-app out of the monorepo ([f1de61e](https://github.com/differentialhq/differential/commit/f1de61e714582980501764585f09b0968a223938))
- Remove executable from package.json ([8c3a8c5](https://github.com/differentialhq/differential/commit/8c3a8c5c98d61ba24311d0a9ae261fb2f759ddfc))
- Remove obsolete dependency ([2c81915](https://github.com/differentialhq/differential/commit/2c81915383dcafeed14961207d9ffee4dff99c84))
- Remove obsolete fly and listenerconfigs ([9ba1719](https://github.com/differentialhq/differential/commit/9ba171922a0160f20b557bf5c85631c2a549a15a))

### Features

- Adding changeset builder ([241b825](https://github.com/differentialhq/differential/commit/241b825aca4966a25f69f09c145cef57ec417838))
- Adding function support ([372b897](https://github.com/differentialhq/differential/commit/372b897dbad2ea3b871d6e5c0bdb28d121995cd8))
- Adding long polling support for control-plane ([98a6b69](https://github.com/differentialhq/differential/commit/98a6b69b340cfa67c3fa1759d0de9cfdf6c8f7ec))
- Initiall commit on the app ([3453496](https://github.com/differentialhq/differential/commit/34534961d59f28f62ff7d26597117cd26ac0c731))
- **sdk:** Add setConcurrency to dynamically change host concurrency ([fcbbd40](https://github.com/differentialhq/differential/commit/fcbbd401ec3aa0356aaf7e5b43d38d700c3974a4))
- Updating the docs to 3.0 ([732247b](https://github.com/differentialhq/differential/commit/732247b82975553f47d23d82f9b6fd1a7106e1a4))

# [](https://github.com/differentialhq/differential/compare/v0.0.0...v) (2023-12-24)

### Bug Fixes

- Adding a bin script ([e9f4a61](https://github.com/differentialhq/differential/commit/e9f4a61e1fc8fb75c85b14d9f21c5b1aee812be0))
- Adding the package name ([3338eba](https://github.com/differentialhq/differential/commit/3338ebaa7ab91ef9e5afb6acbe2967e90a4bd7a3))
- Allow all commit history for changelogs ([530f868](https://github.com/differentialhq/differential/commit/530f868db5dd6a6ece7aa803d14edf3206585195))
- Allow parallel function executions upto concurrency limit ([e431ff3](https://github.com/differentialhq/differential/commit/e431ff3cd41bce61a460e2bc89858d526c25df85))
- Allow services to start idempotently ([bf1c307](https://github.com/differentialhq/differential/commit/bf1c3079f1e8c4be56f9953a42c20e829397d8e1))
- **client:** Polling is now service specific. Each service can poll independently ([f7c160d](https://github.com/differentialhq/differential/commit/f7c160dca51b73fd2ed9a8d2eb2df1a96f02d5a0))
- Deprecate unused modules ([27394f4](https://github.com/differentialhq/differential/commit/27394f46aa1b752568db4250d0f29205fc3c3d67))
- Enforce service name param ([#5](https://github.com/differentialhq/differential/issues/5)) ([b0aadd7](https://github.com/differentialhq/differential/commit/b0aadd7e43a6c65b40d250c227ec906d65ee2320))
- Fix types to be more strict on call and background ([ec29dd2](https://github.com/differentialhq/differential/commit/ec29dd2d75a3e9a1a950f17e914ba8300d925333))
- **listeners:** Let listener params be optional ([eb24277](https://github.com/differentialhq/differential/commit/eb2427797213c61ecf95df6632290826aeefa1d9))
- Move differential-app out of the monorepo ([f1de61e](https://github.com/differentialhq/differential/commit/f1de61e714582980501764585f09b0968a223938))
- Remove executable from package.json ([8c3a8c5](https://github.com/differentialhq/differential/commit/8c3a8c5c98d61ba24311d0a9ae261fb2f759ddfc))
- Remove obsolete dependency ([2c81915](https://github.com/differentialhq/differential/commit/2c81915383dcafeed14961207d9ffee4dff99c84))
- Remove obsolete fly and listenerconfigs ([9ba1719](https://github.com/differentialhq/differential/commit/9ba171922a0160f20b557bf5c85631c2a549a15a))

### Features

- Adding changeset builder ([241b825](https://github.com/differentialhq/differential/commit/241b825aca4966a25f69f09c145cef57ec417838))
- Adding function support ([372b897](https://github.com/differentialhq/differential/commit/372b897dbad2ea3b871d6e5c0bdb28d121995cd8))
- Adding long polling support for control-plane ([98a6b69](https://github.com/differentialhq/differential/commit/98a6b69b340cfa67c3fa1759d0de9cfdf6c8f7ec))
- Initiall commit on the app ([3453496](https://github.com/differentialhq/differential/commit/34534961d59f28f62ff7d26597117cd26ac0c731))
- **sdk:** Add setConcurrency to dynamically change host concurrency ([fcbbd40](https://github.com/differentialhq/differential/commit/fcbbd401ec3aa0356aaf7e5b43d38d700c3974a4))
- Updating the docs to 3.0 ([732247b](https://github.com/differentialhq/differential/commit/732247b82975553f47d23d82f9b6fd1a7106e1a4))

# 0.0.0 (2023-08-25)
