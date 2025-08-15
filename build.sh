rm -rf dist
mkdir ./dist/
cp context.json dist/context.json

# BSBM Generation
docker run -v "$PWD:/app/data" -e "DATA_DESTINATION=bsbm" vcity/bsbm generate -s ttl

node bsbm.js

# LUBM Generation (dereferences remote dataset)
echo "Generating LUBM credentials by dereferencing remote dataset..."
node lubm.js

# SP2B Generation
echo "Generating SP2B dataset (dockerized) and credentials..."
# You can override TRIPLES via environment for larger datasets, e.g. TRIPLES=1000000
bash ./scripts/sp2b-fetch-run.sh
node sp2b.js

rm -rf bsbm
rm -rf .cache

mkdir -p dist/lubm/queries
cp -r lubm/queries dist/lubm
# # Queries are generate using an LLM looking at http://wbsg.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/spec/ExploreUseCase/index.html
mkdir -p dist/bsbm/queries
cp -r bsbmq/queries dist/bsbm

# SP2B Queries (fetched from official source by scripts/sp2b-fetch-queries.js)
mkdir -p dist/sp2b/queries
cp -r sp2b/queries dist/sp2b

# Rebuild CID index and document loader, then preprocess and transform
node scripts/collect-cids.js && node scripts/join-loaders.js && node canonize.js && node transform.js
