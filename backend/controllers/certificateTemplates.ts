// certificateTemplates.ts
export const certificateTemplates = {
  BONAFIDE: (data: any) => ({
    content: [
      { text: 'BONAFIDE CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 20, 0, 30] },
      { text: 'This is to certify that', fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Program: ${data.program}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Department: ${data.department}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `is a bonafide student of this institution for the academic year ${data.academicYear}.`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: data.reason, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 50, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 40, 0, 0] }
    ]
  }),

  TRANSFER: (data: any) => ({
    content: [
      { text: 'TRANSFER CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 20, 0, 30] },
      { text: 'This is to certify that', fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Date of Birth: ${data.dateOfBirth}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Program: ${data.program}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Department: ${data.department}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'Has studied in this institution and is hereby granted this Transfer Certificate.', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: 'All dues to the institution have been cleared and no objection is held in issuing this certificate.', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 50, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 40, 0, 0] }
    ]
  }),

  COURSE_COMPLETION: (data: any) => ({
    content: [
      { text: 'COURSE COMPLETION CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 20, 0, 30] },
      { text: 'This is to certify that', fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `has successfully completed the ${data.program} program in ${data.department}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `for the academic year ${data.academicYear}.`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: 'The candidate has satisfied the requirements prescribed for the course and is found worthy of receiving this certificate.', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 50, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 40, 0, 0] }
    ]
  }),

  CHARACTER: (data: any) => ({
    content: [
      { text: 'CHARACTER CERTIFICATE', fontSize: 24, bold: true, alignment: 'center', margin: [0, 20, 0, 30] },
      { text: 'This is to certify that', fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Program: ${data.program}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Department: ${data.department}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'was a student of this institution during the academic year', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `${data.academicYear} and their conduct and character were found to be satisfactory.`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: 'We wish them success in all future endeavors.', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 50, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 40, 0, 0] }
    ]
  }),

  OTHER: (data: any) => ({
    content: [
      { text: 'REQUEST', fontSize: 24, bold: true, alignment: 'center', margin: [0, 20, 0, 30] },
      { text: 'The request is approved successfully', fontSize: 16, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: data.studentName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: `Admission Number: ${data.admissionNumber}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Program: ${data.program}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Department: ${data.department}`, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'is a student of this institution.', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: 'Purpose:', fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: data.reason, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 30] },
      { text: `Date: ${data.issuedDate}`, fontSize: 12, alignment: 'right', margin: [0, 50, 0, 0] },
      { text: 'Principal', fontSize: 12, alignment: 'right', margin: [0, 40, 0, 0] }
    ]
  })
};