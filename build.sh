mkdir ./dist/
cp context.json dist/context.json


docker run -v "$PWD:/app/data" -e "DATA_DESTINATION=bsbm" vcity/bsbm generate -s ttl
node bsbm.js

rm -rf bsbm
rm -rf .cache
