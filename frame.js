
const BSBM_NS = 'http://www4.wiwiss.fu-berlin.de/bizer/bsbm/v01/vocabulary/';

export default {
  [`${BSBM_NS}Review`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}ReviewCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}Review`,
      "reviewer": {},
      "reviewFor": {},
      "rating1": { '@optional': true },
      "rating2": { '@optional': true },
      "rating3": { '@optional': true },
      "rating4": { '@optional': true },
      "reviewDate": {},
      "text": {},
      "title": {},
      "date": {},
      "publisher": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}ProductFeature`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}ProductFeatureCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}ProductFeature`,
      "label": {},
      "comment": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}Producer`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}ProducerCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}Producer`,
      "label": {},
      "comment": {},
      "homepage": {},
      "country": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}Product`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}ProductCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}Product`,
      "label": {},
      "comment": {},
      "productType": {},
      "productPropertyNumeric1": { '@optional': true },
      "productPropertyNumeric2": { '@optional': true },
      "productPropertyNumeric3": { '@optional': true },
      "productPropertyTextual1": { '@optional': true },
      "productPropertyTextual2": { '@optional': true },
      "productPropertyTextual3": { '@optional': true },
      "productPropertyTextual5": { '@optional': true },
      "productFeature": {},
      "producer": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}Vendor`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}VendorCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}Vendor`,
      "label": {},
      "comment": {},
      "homepage": {},
      "country": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}Offer`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}OfferCredential`],
    "credentialSubject": {
      "@type": `${BSBM_NS}Offer`,
      "product": {},
      "vendor": {},
      "price": {},
      "validFrom": {},
      "validTo": {},
      "deliveryDays": {},
      "offerWebpage": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  },
  [`${BSBM_NS}Person`]: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://example.org/bsbm/context"
    ],
    "@type": ["VerifiableCredential", `${BSBM_NS}PersonCredential`],
    "credentialSubject": {
      "@type": "http://xmlns.com/foaf/0.1/Person",
      "personName": {},
      "mbox_sha1sum": {},
      "country": {},
      "publisher": {},
      "date": {}
    },
    "validFrom": {},
    "validUntil": {}
  }
};
