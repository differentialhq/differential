.PHONY: docs

docs:
	@echo "Generating docs..."

	cd ts-core && \
	npm run docs

	cd docs && \
	cp -r ../ts-core/docs/* ./api && \
	rm ./api/modules.md

	@echo "Done"