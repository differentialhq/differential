npm run service --name=executor&
PID=$!

# Basic
npm run command --name=basic
npm run command --name=parallel-100
npm run command --name=parallel-1000
# fails. needs connection reuse.
# npm run command --name=parallel-10000

kill $PID
