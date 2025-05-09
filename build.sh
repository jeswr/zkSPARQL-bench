rm -rf dist
mkdir ./dist/
cp context.json dist/context.json

# BSBM Generation
docker run -v "$PWD:/app/data" -e "DATA_DESTINATION=bsbm" vcity/bsbm generate -s ttl

node bsbm.js

rm -rf bsbm
rm -rf .cache

mkdir -p dist/lubm/queries
cp -r lubm/queries dist/lubm
# # Queries are generate using an LLM looking at http://wbsg.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/spec/ExploreUseCase/index.html
mkdir -p dist/bsbm/queries
cp -r bsbmq/queries dist/bsbm

node scripts/collect-cids.js
node scripts/join-loaders.js
