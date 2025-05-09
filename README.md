# zkSPARQL-bench

### Using the bechmark

The benchmark is generated and released to

https://github.com/jeswr/zkSPARQL-bench/archive/refs/tags/vX.Y.Z.zip

The benchmark can be directly downloaded and used

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

Known Limitations:

* Credential subjects are not always well modelled in order to suit the benchmark. For instance reviews should not be the subject of a credential.
