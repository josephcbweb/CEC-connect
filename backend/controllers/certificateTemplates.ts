

export interface CertificateData {
  studentName: string;
  admissionNumber: string;
  program?: string;
  department?: string;
  dateOfBirth?: string;
  reason?: string;
  issuedDate: string;
  academicYear?: string;
}

export const certificateTemplates = {
  BONAFIDE: (data: CertificateData) => ({
    title: 'BONAFIDE CERTIFICATE',
    content: [
      { text: 'BONAFIDE CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'This is to certify that', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.program && { text: `Program: ${data.program}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.department && { text: `Department: ${data.department}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      { text: `is a bonafide student of this institution for the academic year ${data.academicYear || '2024-25'}.`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      data.reason && { text: `Purpose: ${data.reason}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'This certificate is issued on request of the student for whatever purpose it may serve.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 20, 0, 0] },
      { text: 'Principal/Registrar', fontSize: 12, alignment: 'right', margin: [0, 30, 0, 0] }
    ].filter(Boolean)
  }),

  TRANSFER: (data: CertificateData) => ({
    title: 'TRANSFER CERTIFICATE',
    content: [
      { text: 'TRANSFER CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'This is to certify that', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.dateOfBirth && { text: `Date of Birth: ${data.dateOfBirth}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.program && { text: `Program: ${data.program}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.department && { text: `Department: ${data.department}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      { text: 'The has studied in College Of Engineering Cherthala', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'The student has paid all dues and there is no objection to his/her transfer.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'The student bears a good moral character during his/her stay in this institution.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 20, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 30, 0, 0] }
    ].filter(Boolean)
  }),

  COURSE_COMPLETION: (data: CertificateData) => ({
    title: 'COURSE COMPLETION CERTIFICATE',
    content: [
      { text: 'COURSE COMPLETION CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'This is to certify that', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.program && { text: `has successfully completed the ${data.program} program`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.department && { text: `in the Department of ${data.department}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      { text: 'from __________ to __________.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'The student has satisfactorily completed all the requirements of the course.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 20, 0, 0] },
      { text: 'Head of Department', fontSize: 12, alignment: 'right', margin: [0, 30, 0, 0] }
    ].filter(Boolean)
  }),

  CHARACTER: (data: CertificateData) => ({
    title: 'CHARACTER CERTIFICATE',
    content: [
      { text: 'CHARACTER CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'This is to certify that', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.program && { text: `Program: ${data.program}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      { text: 'was a student of this institution during the academic year __________.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'During his/her period of study in this institution, his/her conduct and character were satisfactory.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'He/She bears a good moral character and is law abiding.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 20, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 30, 0, 0] }
    ].filter(Boolean)
  }),

  OTHER: (data: CertificateData) => ({
    title: 'CERTIFICATE',
    content: [
      { text: 'CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'This is to certify that', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.program && { text: `Program: ${data.program}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.department && { text: `Department: ${data.department}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      data.reason && { text: `Purpose: ${data.reason}`, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'This certificate is issued on request of the student for whatever purpose it may serve.', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 20, 0, 0] },
      { text: 'Principal/Registrar', fontSize: 12, alignment: 'right', margin: [0, 30, 0, 0] }
    ].filter(Boolean)
  })
};