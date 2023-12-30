echo "Setting up the project..."

echo "Installing dependencies..."
npm install

echo "Obtaining API secret..."
API_SECRET=$(curl https://api.differential.dev/demo/token)

# replace the API_SECRET with the string REPLACE_ME in src/d.ts file.
sed -i '' "s/REPLACE_ME/$API_SECRET/g" src/d.ts

echo "Setup complete! 🎉"

echo ""
echo "To play with the demo, run the following commands in separate terminals:"
echo "  👉 Running the service:"
echo "        npm run service --name=hello"
echo "  👉 Running the consumer:"
echo "        npm run command --name=greet"
echo ""