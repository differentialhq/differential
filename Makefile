.PHONY: docs

docs:
	@echo "Generating docs..."

	cd ts-core && \
	npm run docs

	cd docs && \
	cp ../ts-core/docs/* ./api

	@echo "Done"