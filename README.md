# zkSPARQL-bench

### Using the bechmark

The benchmark is generated and released to

https://registry.npmjs.org/zksparql-bench/-/zksparql-bench-X.Y.Z.tgz

The benchmark can be directly downloaded and used:

- the dataset can be found in the credentials contained in dist/BENCHMARK_NAME/data-signed/
- the `documentLoaderContent.json` gives all URL resolutions that need to be overridden when performing the benchmark

### Contributing

A benchmark for zero knowledge SPARQL queries over Verifiable Credential. To generate the benchmark run

```
npm i
npm run build
```

Requirements:

* Docker
* Nodejs (>= 22.x)

TODO:

* Add a DCAT description of the benchmark
* Add query answer checkers
  * For LUBM this can be based on https://swat.cse.lehigh.edu/projects/lubm/
* Check the generated queries
* Dont publish the dist to github, it publishes each file individually which is time consuming

Known Limitations:

* Credential subjects are not always well modelled in order to suit the benchmark. For instance reviews should not be the subject of a credential.
