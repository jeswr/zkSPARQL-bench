mkdir ./dist/
cp context.json dist/context.json

# BSBM Generation
docker run -v "$PWD:/app/data" -e "DATA_DESTINATION=bsbm" vcity/bsbm generate -s ttl
wget https://github.com/VCityTeam/BSBM/archive/refs/tags/v1.4.0.zip
unzip v1.4.0.zip
rm -rf v1.4.0.zip

node bsbm.js

rm -rf bsbm
rm -rf .cache
