const UB = 'http://www.lehigh.edu/~zhp2/2004/0401/univ-bench.owl#';

export default {
  [`${UB}University`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}UniversityCredential`],
    'credentialSubject': {
      '@type': `${UB}University`,
  'ubName': {},
      'subOrganizationOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}Department`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}DepartmentCredential`],
    'credentialSubject': {
      '@type': `${UB}Department`,
  'ubName': {},
      'subOrganizationOf': {},
      'headOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}ResearchGroup`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}ResearchGroupCredential`],
    'credentialSubject': {
      '@type': `${UB}ResearchGroup`,
      'subOrganizationOf': {},
  'ubName': {}
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}GraduateStudent`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}GraduateStudentCredential`],
    'credentialSubject': {
      '@type': `${UB}GraduateStudent`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'memberOf': { '@optional': true },
      'takesCourse': { '@optional': true },
      'mastersDegreeFrom': { '@optional': true },
      'undergraduateDegreeFrom': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}UndergraduateStudent`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}UndergraduateStudentCredential`],
    'credentialSubject': {
      '@type': `${UB}UndergraduateStudent`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'memberOf': { '@optional': true },
      'takesCourse': { '@optional': true },
      'undergraduateDegreeFrom': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}Professor`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}ProfessorCredential`],
    'credentialSubject': {
      '@type': `${UB}Professor`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'worksFor': { '@optional': true },
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}FullProfessor`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}FullProfessorCredential`],
    'credentialSubject': {
      '@type': `${UB}FullProfessor`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'worksFor': { '@optional': true },
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}AssociateProfessor`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}AssociateProfessorCredential`],
    'credentialSubject': {
      '@type': `${UB}AssociateProfessor`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'worksFor': { '@optional': true },
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}AssistantProfessor`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}AssistantProfessorCredential`],
    'credentialSubject': {
      '@type': `${UB}AssistantProfessor`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'worksFor': { '@optional': true },
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}Lecturer`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}LecturerCredential`],
    'credentialSubject': {
      '@type': `${UB}Lecturer`,
  'ubName': {},
      'emailAddress': { '@optional': true },
      'worksFor': { '@optional': true },
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}Course`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}CourseCredential`],
    'credentialSubject': {
      '@type': `${UB}Course`,
  'ubName': {},
      'teacherOf': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  },
  [`${UB}Publication`]: {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://example.org/lubm/context'
    ],
    '@type': ['VerifiableCredential', `${UB}PublicationCredential`],
    'credentialSubject': {
      '@type': `${UB}Publication`,
  'ubName': { '@optional': true },
      'publicationAuthor': { '@optional': true }
    },
    'validFrom': {},
    'validUntil': {}
  }
};
