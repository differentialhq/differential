all: fetch

update-contract:
	mkdir -p src
	curl https://api.differential.dev/contract | jq -r '.contract' > src/contract.ts

clean:
	rm -f src/contract.ts

.PHONY: all fetch clean
