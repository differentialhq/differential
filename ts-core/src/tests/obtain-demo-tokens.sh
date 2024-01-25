#!/bin/bash

# This can't be run on macOS because of the sed command.

for file in `find . -name "d.ts" -type f`; do
    echo "Processing $file..."

    TOKEN=$(curl -s https://api.differential.dev/demo/token)

    sed -i "s/const secret = process.env.DIFFERENTIAL_API_SECRET/const secret = '$TOKEN'/g" $file
done

echo "Processing complete."
