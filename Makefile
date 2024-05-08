.PHONY: docs

docs:
	@echo "Generating docs..."

	cd sdk && \
	npm run docs

	cd docs && \
	cp -r ../sdk/docs/* ./api && \
	rm ./api/modules.md

	@echo "Done"