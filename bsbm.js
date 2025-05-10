import deref from 'rdf-dereference-store';
import { rdf, foaf } from 'rdf-namespaces';
import { DataFactory as DF } from 'n3';
import jsonld from 'jsonld';
import { documentLoader, signCredential, generateCIDDocument } from '@jeswr/vc-cli';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contexts from './context.json' with { type: 'json' };
import frames from './frame.js';

const bsbm = await deref.default('bsbm/dataset.ttl', {
  localFiles: true
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BSBM_NS = 'http://www4.wiwiss.fu-berlin.de/bizer/bsbm/v01/vocabulary/';
const CRED = 'https://www.w3.org/2018/credentials#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';

const legalProductTypes = [
  `${BSBM_NS}Producer`,
  `${BSBM_NS}Vendor`,
  foaf.Person,
];

const productTypes = [
  ...legalProductTypes,
  `${BSBM_NS}ProductFeature`,
  `${BSBM_NS}Product`,
  `${BSBM_NS}Offer`,
  `${BSBM_NS}Review`,
];

const documentLoaderWithContexts = async (url) => {
  if (contexts[url.toString()]) {
    return {
      contextUrl: null,
      document: contexts[url.toString()],
      documentUrl: url
    }
  }
  return documentLoader(url);
}

const cidLocations = {};

async function signCredentialWithCLI(credentialPath, cidPath, outputPath, publisher, privateKeys) {
  try {
    // Sign credential using npx vc-cli with Ed25519 signature
    console.log(`Signing credential ${credentialPath}...`);
    const signed = await signCredential({
      documentLoaderContent: contexts,
      document: JSON.parse(fs.readFileSync(credentialPath, 'utf8')),
      cid: JSON.parse(fs.readFileSync(cidPath, 'utf8')),
      keyId: `${publisher}#key-1`,
      privateKeys
    });
    fs.writeFileSync(outputPath, JSON.stringify(signed, null, 2));
    // execSync(command);
    console.log(`Successfully signed credential to ${outputPath}`);
  } catch (error) {
    console.error(`Error signing credential ${credentialPath}:`, error.message);
  }
}

let privateKeys = {};

async function generateCid(subject, outputPath) {
  try {
    // Generate CID using vc-cli
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const cid = await generateCIDDocument(subject);
    fs.writeFileSync(outputPath, JSON.stringify(cid.cid, null, 2));
    privateKeys = { ...privateKeys, ...cid.privateKeys };
    console.log(`Successfully generated CID for ${subject}`);
    cidLocations[subject] = outputPath;
  } catch (error) {
    console.error(`Error generating CID for ${subject}:`, error.message);
  }
}

await generateCid('http://www4.wiwiss.fu-berlin.de/bizer/bsbm/v01/instances/dataFromRatingSite1/RatingSite1', path.join(__dirname, 'dist', 'bsbm', 'cid', 'site', 'RatingSite1-cid.json'));
await generateCid('http://www4.wiwiss.fu-berlin.de/bizer/bsbm/v01/instances/StandardizationInstitution1', path.join(__dirname, 'dist', 'bsbm', 'cid', 'institution', 'StandardizationInstitution1-cid.json'));

for (const legalProductType of legalProductTypes) {
  const typeDir = legalProductType.split('/').pop().toLowerCase();
  const outputDir = path.join(__dirname, 'dist', 'bsbm', 'cid', typeDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  for (const triple of bsbm.store.match(null, rdf.type, DF.namedNode(legalProductType))) {
    const outputPath = path.join(outputDir, `${triple.subject.value.split('/').pop()}-cid.json`);
    await  generateCid(triple.subject.value, outputPath);
  }
}

fs.writeFileSync(path.join(__dirname, 'dist', 'privateKeys.json'), JSON.stringify(privateKeys, null, 2));

// Replace the single review loop with a loop over all product types
for (const productType of productTypes) {
  // Create directory structure based on product type
  const typeDir = productType.split('/').pop().toLowerCase();
  const rawOutputDir = path.join(__dirname, 'dist', 'bsbm', 'data-raw', typeDir);
  const signedOutputDir = path.join(__dirname, 'dist', 'bsbm', 'data-signed', typeDir);
  if (!fs.existsSync(rawOutputDir)) {
    fs.mkdirSync(rawOutputDir, { recursive: true });
  }
  if (!fs.existsSync(signedOutputDir)) {
    fs.mkdirSync(signedOutputDir, { recursive: true });
  }
  for (const triple of bsbm.store.match(null, rdf.type, DF.namedNode(productType))) {
    const entityData = bsbm.store.match(triple.subject, null, null);
    entityData.add(DF.quad(DF.namedNode(`${triple.subject.value}Credential`), DF.namedNode(`${CRED}credentialSubject`), triple.subject));
    entityData.add(DF.quad(DF.namedNode(`${triple.subject.value}Credential`), rdf.type, DF.namedNode(`${CRED}VerifiableCredential`)));
    entityData.add(DF.quad(DF.namedNode(`${triple.subject.value}Credential`), rdf.type, DF.namedNode(`${productType}Credential`)));
    
    // between the year 2000 and 2100 as xsd:dateTime
    const validFrom = DF.literal(new Date('2000-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    const validTo = DF.literal(new Date('2100-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    entityData.add(DF.quad(DF.namedNode(`${triple.subject.value}Credential`), DF.namedNode(`${CRED}validFrom`), validFrom));
    entityData.add(DF.quad(DF.namedNode(`${triple.subject.value}Credential`), DF.namedNode(`${CRED}validUntil`), validTo));

    const framed = await jsonld.frame(await jsonld.fromRDF(entityData, { documentLoader: documentLoaderWithContexts }), frames[productType], {
      documentLoader: documentLoaderWithContexts,
      compactToRelative: false,
      explicit: false
    });

    // delete any fields (including nested) with null object in the framed document
    const deleteNullFields = (obj) => {
      for (const key in obj) {
        if (obj[key] === null) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          deleteNullFields(obj[key]); 
        }
      }
    };
    deleteNullFields(framed);

    // Add a check that the framed document contains the same number of triples as the original document
    const data = await jsonld.toRDF(framed, {
      documentLoader: documentLoaderWithContexts,
    });

    if (data.length !== entityData.size) {
      throw new Error('Framed document contains a different number of triples than the original document');
    }

    const outputPath = path.join(rawOutputDir, `${triple.subject.value.split('/').pop()}.jsonld`);
    fs.writeFileSync(outputPath, JSON.stringify(framed, null, 2));

    const [{ object: publisher }] = bsbm.store.match(triple.subject, DF.namedNode('http://purl.org/dc/elements/1.1/publisher'), null);

    // Sign the credential with the publisher's CID
    if (cidLocations[publisher.value]) {
      const signedOutputPath = path.join(signedOutputDir, `${triple.subject.value.split('/').pop()}.jsonld`);
      await signCredentialWithCLI(outputPath, cidLocations[publisher.value], signedOutputPath, publisher.value, privateKeys);
    } else {
      console.warn(`No CID found for publisher ${publisher.value}`);
    }
  }
}
