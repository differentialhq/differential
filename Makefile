.PHONY: docs

docs:
	@echo "Generating docs..."

	cd ts-core && \
	npm run docs

	cd docs && \
	cp ../ts-core/docs/classes/* ./api

	@echo "Done"