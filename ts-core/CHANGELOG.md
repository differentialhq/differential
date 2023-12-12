## 3.0.0 (2023-12-12)

##### Breaking Changes

*  Representing machine types and listeners as Worker Pools (cdffc61a)

##### Chores

* **sdk:**  Move to new dir structure (a2a2a82c)
* **docs:**
  *  Updating the docs to new package name (6c2adc81)
  *  Adding the root README (4c51e85b)
*  Fix build commands (5cc8ed47)
*  Add control plane back without git history (28b182ec)
*  Remove git submodule (063b4f46)
*  Adding docs to the monorepo (5110192d)
*  Moving control-plane to the monorepo (31966bfe)
*  Adding the SDK to monorepo (c3bb7db4)
*  Update examples to 2.0 (83cfacdd)
*  Update logs (d02dc77d)
*  Fix the Makefile to not path automatically (f4d34716)

##### Documentation Changes

* **sdk:**  Adding 3.0 docs to the SDK (8c692b5c)

##### New Features

*  Adding long polling support for control-plane (98a6b69b)
*  Adding function support (372b897d)
* **sdk:**  Add setConcurrency to dynamically change host concurrency (fcbbd401)

##### Bug Fixes

* **client:**  Polling is now service specific. Each service can poll independently (f7c160dc)
* **listeners:**  Let listener params be optional (eb242779)

## 2.0.0 (2023-12-09)

##### Breaking Changes

*  Representing machine types and listeners as Worker Pools (cdffc61a)

##### Chores

*  Update logs (d02dc77d)
*  Fix the Makefile to not path automatically (f4d34716)

#### 1.1.1 (2023-12-05)

##### Bug Fixes

* **listeners:**  Let listener params be optional (eb242779)

### 1.1.0 (2023-12-04)

##### New Features

* **sdk:**  Add setConcurrency to dynamically change host concurrency (fcbbd401)

