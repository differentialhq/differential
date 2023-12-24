all: fetch

update-contract:
	mkdir -p src
	curl https://api.differential.dev/contract | jq -r '.contract' > src/contract.ts

clean:
	rm -f src/contract.ts

publish:
	npm publish

update-examples:
	cd examples/1_greet && npm i @differentialhq/core@latest && cd ..
	cd examples/2_api && npm i @differentialhq/core@latest && cd ..

.PHONY: all fetch clean
