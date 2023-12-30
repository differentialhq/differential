npm run service --name=executor&
PID=$!

# Basic
npm run command --name=basic
npm run command --name=parallel-100
npm run command --name=parallel-1000

kill $PID
