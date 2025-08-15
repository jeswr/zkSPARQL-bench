import deref from 'rdf-dereference-store';
import { rdf } from 'rdf-namespaces';
import { DataFactory as DF } from 'n3';
import jsonld from 'jsonld';
import { documentLoader, signCredential, generateCIDDocument } from '@jeswr/vc-cli';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import baseContexts from './context.json' with { type: 'json' };
import frames from './lubm-frame.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UB = 'http://www.lehigh.edu/~zhp2/2004/0401/univ-bench.owl#';
const CRED = 'https://www.w3.org/2018/credentials#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';

// Inline LUBM context (kept small; add terms as needed)
const LUBM_CONTEXT = {
  '@context': {
  'ub': 'http://www.lehigh.edu/~zhp2/2004/0401/univ-bench.owl#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',

  'ubName': { '@id': 'ub:name' },
    'emailAddress': { '@id': 'ub:emailAddress' },
    'telephone': { '@id': 'ub:telephone' },

    'memberOf': { '@id': 'ub:memberOf', '@type': '@id' },
    'worksFor': { '@id': 'ub:worksFor', '@type': '@id' },
    'teacherOf': { '@id': 'ub:teacherOf', '@type': '@id' },
    'takesCourse': { '@id': 'ub:takesCourse', '@type': '@id' },

    'subOrganizationOf': { '@id': 'ub:subOrganizationOf', '@type': '@id' },
    'headOf': { '@id': 'ub:headOf', '@type': '@id' },

    'publicationAuthor': { '@id': 'ub:publicationAuthor', '@type': '@id' },
    'publication': { '@id': 'ub:publication', '@type': '@id' },

    'undergraduateDegreeFrom': { '@id': 'ub:undergraduateDegreeFrom', '@type': '@id' },
    'mastersDegreeFrom': { '@id': 'ub:mastersDegreeFrom', '@type': '@id' },
    'doctoralDegreeFrom': { '@id': 'ub:doctoralDegreeFrom', '@type': '@id' },

    'University': { '@id': 'ub:University', '@type': '@id' },
    'Department': { '@id': 'ub:Department', '@type': '@id' },
    'ResearchGroup': { '@id': 'ub:ResearchGroup', '@type': '@id' },
    'GraduateStudent': { '@id': 'ub:GraduateStudent', '@type': '@id' },
    'UndergraduateStudent': { '@id': 'ub:UndergraduateStudent', '@type': '@id' },
  'Professor': { '@id': 'ub:Professor', '@type': '@id' },
  'FullProfessor': { '@id': 'ub:FullProfessor', '@type': '@id' },
    'AssociateProfessor': { '@id': 'ub:AssociateProfessor', '@type': '@id' },
    'AssistantProfessor': { '@id': 'ub:AssistantProfessor', '@type': '@id' },
    'Lecturer': { '@id': 'ub:Lecturer', '@type': '@id' },
    'Course': { '@id': 'ub:Course', '@type': '@id' },
    'Publication': { '@id': 'ub:Publication', '@type': '@id' },

    'UniversityCredential': { '@id': 'ub:UniversityCredential', '@type': '@id' },
    'DepartmentCredential': { '@id': 'ub:DepartmentCredential', '@type': '@id' },
    'ResearchGroupCredential': { '@id': 'ub:ResearchGroupCredential', '@type': '@id' },
    'GraduateStudentCredential': { '@id': 'ub:GraduateStudentCredential', '@type': '@id' },
    'UndergraduateStudentCredential': { '@id': 'ub:UndergraduateStudentCredential', '@type': '@id' },
  'ProfessorCredential': { '@id': 'ub:ProfessorCredential', '@type': '@id' },
  'FullProfessorCredential': { '@id': 'ub:FullProfessorCredential', '@type': '@id' },
    'AssociateProfessorCredential': { '@id': 'ub:AssociateProfessorCredential', '@type': '@id' },
    'AssistantProfessorCredential': { '@id': 'ub:AssistantProfessorCredential', '@type': '@id' },
    'LecturerCredential': { '@id': 'ub:LecturerCredential', '@type': '@id' },
    'CourseCredential': { '@id': 'ub:CourseCredential', '@type': '@id' },
    'PublicationCredential': { '@id': 'ub:PublicationCredential', '@type': '@id' }
  }
};

const contexts = {
  ...baseContexts,
  'https://example.org/lubm/context': LUBM_CONTEXT
};

// Dereference public LUBM sample dataset (RDF/XML)
const LUBM_DATA_URL = process.env.LUBM_DATA_URL || 'https://swat.cse.lehigh.edu/projects/lubm/University0_0.owl';
let lubm;
try {
  console.log(`Dereferencing LUBM dataset from ${LUBM_DATA_URL} ...`);
  lubm = await deref.default(LUBM_DATA_URL);
  console.log('Loaded LUBM dataset into store');
} catch (e) {
  console.error('Failed to dereference LUBM dataset:', e.message);
  process.exit(1);
}

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
let privateKeys = {};

function iriToFilename(iri) {
  let candidate;
  try {
    const u = new URL(iri);
    const last = u.pathname.split('/').filter(Boolean).pop();
    candidate = (last && last.length > 0) ? last : (u.hostname || iri);
  } catch (e) {
    // Fallback to raw IRI if URL parsing fails
    candidate = iri;
  }
  // Remove any URI scheme (e.g., http:, https:)
  candidate = candidate.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, '');
  // Replace any remaining path or fragment separators with '-'
  candidate = candidate.replace(/[\/#]/g, '-');
  // Keep only safe filename characters (alphanum, dot, dash, underscore)
  candidate = candidate.replace(/[^A-Za-z0-9._-]/g, '-');
  // Trim redundant dashes
  candidate = candidate.replace(/-+/g, '-').replace(/^-/g, '').replace(/-$/g, '');
  if (!candidate) {
    // Fallback to base64url of IRI if nothing remains
    candidate = Buffer.from(iri).toString('base64url');
  }
  return candidate;
}

// Create a friendly, type-aware base name for CID files, e.g., university0.json
function iriToCidBasename(iri, typeDir) {
  const type = (typeDir || '').toLowerCase();
  const s = String(iri);
  // Match tokens like University0, Department0, ResearchGroup0 (case-insensitive)
  const patterns = {
    university: /university\d+/i,
    department: /department\d+/i,
    researchgroup: /research\s*group\d+/i, // be robust to potential spacing
  };
  const rx = patterns[type];
  if (rx) {
    const m = s.match(rx);
    if (m && m[0]) {
      return `${m[0].replace(/\s+/g, '').toLowerCase()}.json`;
    }
  }
  // Fallback: sanitized last segment
  return `${iriToFilename(iri)}.json`;
}

async function signCredentialWithCLI(credentialPath, cidPath, outputPath, issuer, keys) {
  try {
    const signed = await signCredential({
      documentLoaderContent: contexts,
      document: JSON.parse(fs.readFileSync(credentialPath, 'utf8')),
      cid: JSON.parse(fs.readFileSync(cidPath, 'utf8')),
      keyId: `${issuer}#key-1`,
      privateKeys: keys
    });
    fs.writeFileSync(outputPath, JSON.stringify(signed, null, 2));
    console.log(`Signed LUBM credential -> ${outputPath}`);
  } catch (error) {
    console.error(`Error signing credential ${credentialPath}:`, error.message);
  }
}

async function generateCid(subject, outputPath) {
  try {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    const cid = await generateCIDDocument(subject);
    fs.writeFileSync(outputPath, JSON.stringify(cid.cid, null, 2));
    privateKeys = { ...privateKeys, ...cid.privateKeys };
    cidLocations[subject] = outputPath;
    console.log(`Generated CID for ${subject}`);
  } catch (error) {
    console.error(`Error generating CID for ${subject}:`, error.message);
  }
}

const issuerTypes = [
  `${UB}University`,
  `${UB}Department`,
  `${UB}ResearchGroup`,
];

const subjectTypes = [
  ...issuerTypes,
  `${UB}GraduateStudent`,
  `${UB}UndergraduateStudent`,
  `${UB}Professor`,
  `${UB}FullProfessor`,
  `${UB}AssociateProfessor`,
  `${UB}AssistantProfessor`,
  `${UB}Lecturer`,
  `${UB}Course`,
  `${UB}Publication`,
];

for (const cls of issuerTypes) {
  const typeDir = cls.split('#').pop();
  const outDir = path.join(__dirname, 'dist', 'lubm', 'cid', typeDir.toLowerCase());
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const triple of lubm.store.match(null, rdf.type, DF.namedNode(cls))) {
  const base = iriToCidBasename(triple.subject.value, typeDir);
  await generateCid(triple.subject.value, path.join(outDir, base));
  }
}

fs.writeFileSync(path.join(__dirname, 'dist', 'privateKeys.json'), JSON.stringify(privateKeys, null, 2));

function findIssuer(subject) {
  for (const t of issuerTypes) {
    if (lubm.store.countQuads(DF.namedNode(subject), rdf.type, DF.namedNode(t), null) > 0) {
      return subject;
    }
  }
  const ub = (local) => DF.namedNode(`${UB}${local}`);
  for (const q of lubm.store.match(DF.namedNode(subject), ub('worksFor'), null)) {
    return q.object.value;
  }
  for (const q of lubm.store.match(DF.namedNode(subject), ub('memberOf'), null)) {
    return q.object.value;
  }
  for (const prof of lubm.store.match(null, ub('teacherOf'), DF.namedNode(subject))) {
    for (const dept of lubm.store.match(prof.subject, ub('worksFor'), null)) {
      return dept.object.value;
    }
  }
  // If subject is a Publication, find its authors then their orgs
  for (const author of lubm.store.match(DF.namedNode(subject), ub('publicationAuthor'), null)) {
    for (const dept of lubm.store.match(author.object, ub('worksFor'), null)) {
      return dept.object.value;
    }
    for (const dept of lubm.store.match(author.object, ub('memberOf'), null)) {
      return dept.object.value;
    }
  }
  return null;
}

for (const cls of subjectTypes) {
  const typeDir = cls.split('#').pop();
  const rawDir = path.join(__dirname, 'dist', 'lubm', 'data-raw', typeDir.toLowerCase());
  const signedDir = path.join(__dirname, 'dist', 'lubm', 'data-signed', typeDir.toLowerCase());
  if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
  if (!fs.existsSync(signedDir)) fs.mkdirSync(signedDir, { recursive: true });

  for (const triple of lubm.store.match(null, rdf.type, DF.namedNode(cls))) {
    const subject = triple.subject.value;
  const id = iriToFilename(subject);

    const entityData = lubm.store.match(triple.subject, null, null);
    entityData.add(DF.quad(DF.namedNode(`${subject}Credential`), DF.namedNode(`${CRED}credentialSubject`), triple.subject));
    entityData.add(DF.quad(DF.namedNode(`${subject}Credential`), rdf.type, DF.namedNode(`${CRED}VerifiableCredential`)));
    entityData.add(DF.quad(DF.namedNode(`${subject}Credential`), rdf.type, DF.namedNode(`${cls}Credential`)));

    const validFrom = DF.literal(new Date('2000-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    const validTo = DF.literal(new Date('2100-01-01T00:00:00Z').toISOString(), DF.namedNode(`${XSD}dateTime`));
    entityData.add(DF.quad(DF.namedNode(`${subject}Credential`), DF.namedNode(`${CRED}validFrom`), validFrom));
    entityData.add(DF.quad(DF.namedNode(`${subject}Credential`), DF.namedNode(`${CRED}validUntil`), validTo));

    const framed = await jsonld.frame(await jsonld.fromRDF(entityData, { documentLoader: documentLoaderWithContexts }), frames[cls], {
      documentLoader: documentLoaderWithContexts,
      compactToRelative: false,
      explicit: false
    });

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

  const rawPath = path.join(rawDir, `${id}.jsonld`);
    fs.writeFileSync(rawPath, JSON.stringify(framed, null, 2));

    const issuer = findIssuer(subject);
    if (!issuer) {
      console.warn(`No issuer found for ${subject}; skipping signing.`);
      continue;
    }
    const cidPath = cidLocations[issuer];
    if (!cidPath) {
      console.warn(`No CID available for issuer ${issuer}; skipping signing.`);
      continue;
    }
  const signedPath = path.join(signedDir, `${id}.jsonld`);
    await signCredentialWithCLI(rawPath, cidPath, signedPath, issuer, privateKeys);
  }
}
