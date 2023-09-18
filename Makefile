all: fetch

fetch-contract:
	mkdir -p src
	curl https://api.differential.dev/contract | jq -r '.contract' > src/contract.ts

clean:
	rm -f src/contract.ts

publish:
	npm version patch
	npm publish

.PHONY: all fetch clean
