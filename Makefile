all: fetch

fetch-contract:
	mkdir -p src
	curl https://api.differential.dev/contract | jq -r '.contract' > src/contract.ts

clean:
	rm -f src/contract.ts

publish:
	npm version patch
	npm publish

update-examples:
	cd examples/1_greet && npm i @differential-dev/sdk@latest && cd ..
	cd examples/2_api && npm i @differential-dev/sdk@latest && cd ..

typedoc:
	npx typedoc --plugin typedoc-plugin-markdown --out docs src/index.ts --excludePrivate --hideBreadcrumbs

.PHONY: all fetch clean
