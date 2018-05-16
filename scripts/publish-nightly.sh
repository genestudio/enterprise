#!/bin/bash

PKG_VERSION=$(node -p "require('./publish/package.json').version")
DATE=$(date +%Y%m%d)

echo "//registry.npmjs.org/:_authToken=\${NPM_AUTH_TOKEN}" > .npmrc

npx grunt publish
cd publish
npm version $PKG_VERSION.$DATE
npm publish --tag dev