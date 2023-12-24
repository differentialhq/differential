set -eux

cd ts-core
make typedoc
cd ..

cd docs
make sync-api-docs
cd ..