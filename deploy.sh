#!/bin/bash

# Path React
FRONTEND_PATH="./frontend"

# Path tujuan (misal folder server, folder static, dll)
TARGET_PATH="./"

echo "🚀 Building React..."
npm install
npm run build

echo "📦 Copying build to target folder..."
cp -r $FRONTEND_PATH/build/* $TARGET_PATH/

echo "🎉 Done! Build copied to $TARGET_PATH"
