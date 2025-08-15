import deref from 'rdf-dereference-store';
import { rdf } from 'rdf-namespaces';
import { DataFactory as DF } from 'n3';
import jsonld from 'jsonld';
import { documentLoader, signCredential, generateCIDDocument } from '@jeswr/vc-cli';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import baseContexts from './context.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CRED = 'https://www.w3.org/2018/credentials#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const DC_E = 'http://purl.org/dc/elements/1.1/';
const DC_T = 'http://purl.org/dc/terms/';
const FOAF = 'http://xmlns.com/foaf/0.1/';

const contexts = {
  ...baseContexts,
};

const documentLoaderWithContexts = async (url) => {
  if (contexts[url.toString()]) {
    return {
      contextUrl: null,
      document: contexts[url.toString()],
      documentUrl: url
    };
  }
  return documentLoader(url);
};

function iriToFilename(iri) {
  let candidate;
  try {
    const u = new URL(iri);
    const last = u.pathname.split('/').filter(Boolean).pop();
    candidate = (last && last.length > 0) ? last : (u.hostname || iri);
  } catch (_) {
    candidate = iri;
  }
  candidate = candidate.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, '');
  candidate = candidate.replace(/[\/#]/g, '-');
  candidate = candidate.replace(/[^A-Za-z0-9._-]/g, '-');
  candidate = candidate.replace(/-+/g, '-').replace(/^-/, '').replace(/-$/, '');
  if (!candidate) candidate = Buffer.from(iri).toString('base64url');
  return candidate;
}

const cidLocations = {};
let privateKeys = {};

async function ensureCidFor(issuer, outDir) {
  if (cidLocations[issuer]) return cidLocations[issuer];
  const base = `${iriToFilename(issuer)}.json`;
  const outPath = path.join(outDir, base);
  if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const cid = await generateCIDDocument(issuer);
  fs.writeFileSync(outPath, JSON.stringify(cid.cid, null, 2));
  privateKeys = { ...privateKeys, ...cid.privateKeys };
  cidLocations[issuer] = outPath;
  return outPath;
}

async function signCredentialWithCLI(credentialPath, cidPath, outputPath, issuer) {
  try {
    const signed = await signCredential({
      documentLoaderContent: contexts,
      document: JSON.parse(fs.readFileSync(credentialPath, 'utf8')),
      cid: JSON.parse(fs.readFileSync(cidPath, 'utf8')),
      keyId: `${issuer}#key-1`,
      privateKeys
    });
    fs.writeFileSync(outputPath, JSON.stringify(signed, null, 2));
    console.log(`Signed SP2B credential -> ${outputPath}`);
  } catch (error) {
    console.error(`Error signing credential ${credentialPath}:`, error.message);
  }
}

function findIssuer(store, subject) {
  const s = DF.namedNode(subject);
  const candidates = [
    DF.namedNode(`${DC_E}publisher`),
    DF.namedNode(`${DC_T}publisher`),
    DF.namedNode(`${DC_E}creator`),
    DF.namedNode(`${DC_T}creator`),
    DF.namedNode(`${FOAF}maker`),
  ];
  for (const p of candidates) {
    const q = store.match(s, p, null);
    const first = q[Symbol.iterator]().next();
    if (!first.done) {
      return first.value.object.value;
    }
  }
  // Fallback to self-issued
  return subject;
}

function isAbsoluteIri(value) {
  try { const u = new URL(value); return !!u.protocol; } catch { return false; }
}

function defaultFrameForType(subject, type) {
  return {
    '@context': 'https://www.w3.org/ns/credentials/v2',
    '@type': [ `${CRED}VerifiableCredential`, `${type}Credential` ],
    [`${CRED}credentialSubject`]: {
      ...(isAbsoluteIri(subject) ? { '@id': subject } : {}),
      '@type': type,
      '@embed': '@always',
      '@explicit': false
  },
  // include core VC properties so they appear in the framed output
  'issuer': {},
  'validFrom': {},
  'validUntil': {}
  };
}

const SP2B_DATA = process.env.SP2B_DATA || path.join(__dirname, 'tmp', 'sp2b.n3');

let sp2b;
try {
  const local = path.isAbsolute(SP2B_DATA) ? SP2B_DATA : path.relative(process.cwd(), SP2B_DATA);
  console.log(`Dereferencing SP2B dataset from ${local} ...`);
  sp2b = await deref.default(local, { localFiles: true });
  console.log('Loaded SP2B dataset into store');
} catch (e) {
  console.error('Failed to dereference SP2B dataset:', e.message);
  process.exit(1);
}

const allTypes = new Set();
for (const q of sp2b.store.match(null, rdf.type, null)) {
  allTypes.add(q.object.value);
}

console.log(`Discovered ${allTypes.size} rdf:types in SP2B dataset`);

const cidDir = path.join(__dirname, 'dist', 'sp2b', 'cid', 'issuer');
const rawBase = path.join(__dirname, 'dist', 'sp2b', 'data-raw');
const signedBase = path.join(__dirname, 'dist', 'sp2b', 'data-signed');
fs.mkdirSync(cidDir, { recursive: true });
fs.mkdirSync(rawBase, { recursive: true });
fs.mkdirSync(signedBase, { recursive: true });

for (const type of allTypes) {
  const typeLocal = (() => {
    try { return new URL(type).hash ? new URL(type).hash.slice(1) : new URL(type).pathname.split('/').filter(Boolean).pop(); } catch { return type; }
  })() || 'unknown';
  const rawDir = path.join(rawBase, typeLocal.toLowerCase());
  const signedDir = path.join(signedBase, typeLocal.toLowerCase());
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(signedDir, { recursive: true });

  for (const t of sp2b.store.match(null, rdf.type, DF.namedNode(type))) {
    const subject = t.subject.value;
    const entityData = sp2b.store.match(t.subject, null, null);

    // determine issuer early so we can include it in the VC data
    const DEFAULT_ISSUER = 'https://example.org/issuer/sp2b';
    let issuer = findIssuer(sp2b.store, subject);
    if (!isAbsoluteIri(issuer)) {
      issuer = DEFAULT_ISSUER;
    }

    // create a stable, absolute IRI for the credential node
    const credIri = isAbsoluteIri(subject)
      ? `${subject}#credential`
      : `https://example.org/credential/sp2b/${iriToFilename(subject)}`;
    const credNode = DF.namedNode(credIri);

    // add VC triples
    entityData.add(DF.quad(credNode, DF.namedNode(`${CRED}credentialSubject`), t.subject));
    entityData.add(DF.quad(credNode, rdf.type, DF.namedNode(`${CRED}VerifiableCredential`)));
    entityData.add(DF.quad(credNode, rdf.type, DF.namedNode(`${type}Credential`)));

    const validFrom = DF.literal(new Date('2000-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    const validTo = DF.literal(new Date('2100-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    entityData.add(DF.quad(credNode, DF.namedNode(`${CRED}validFrom`), validFrom));
    entityData.add(DF.quad(credNode, DF.namedNode(`${CRED}validUntil`), validTo));
    entityData.add(DF.quad(credNode, DF.namedNode(`${CRED}issuer`), DF.namedNode(issuer)));

    const frame = defaultFrameForType(subject, type);
    let framed = await jsonld.frame(await jsonld.fromRDF(entityData, { documentLoader: documentLoaderWithContexts }), frame, {
      documentLoader: documentLoaderWithContexts,
      compactToRelative: false,
      explicit: false
    });

    // Normalize @context to ensure credentials context is first
    const VC_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
    const ctx = framed['@context'];
    if (ctx) {
      if (Array.isArray(ctx)) {
        const filtered = ctx.filter(Boolean).filter(c => c !== VC_CONTEXT);
        framed['@context'] = [VC_CONTEXT, ...filtered];
      } else {
        framed['@context'] = [VC_CONTEXT];
      }
    } else {
      framed['@context'] = [VC_CONTEXT];
    }

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

    // Remove any non-URI ids anywhere in the document (safe mode requires URIs)
    const stripNonUriIds = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(stripNonUriIds);
        return;
      }
      // delete local ids
      if ('id' in node && typeof node.id === 'string' && !isAbsoluteIri(node.id)) {
        delete node.id;
      }
      // recurse into properties
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === 'object') {
          stripNonUriIds(v);
        }
      }
    };
    stripNonUriIds(framed);

    const data = await jsonld.toRDF(framed, { documentLoader: documentLoaderWithContexts });
    if (data.length !== entityData.size) {
      console.warn(`Warning: triple count mismatch for ${subject} (framed=${data.length}, original=${entityData.size}). Proceeding.`);
    }

    const base = iriToFilename(subject);
    const rawPath = path.join(rawDir, `${base}.jsonld`);
    fs.writeFileSync(rawPath, JSON.stringify(framed, null, 2));

    const cidPath = await ensureCidFor(issuer, cidDir);
    const signedPath = path.join(signedDir, `${base}.jsonld`);
    await signCredentialWithCLI(rawPath, cidPath, signedPath, issuer);
  }
}

fs.writeFileSync(path.join(__dirname, 'dist', 'privateKeys.json'), JSON.stringify(privateKeys, null, 2));
console.log('SP2B VC generation completed.');
