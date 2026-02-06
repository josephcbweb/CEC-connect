
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Start seeding S1 and S4 students...");

  // Ensure Departments exist
  let cse = await prisma.department.findFirst({
    where: { 
        OR: [
            { name: "computer science and engineering" },
            { department_code: "CSE" }
        ]
    }
  });
  if (!cse) {
      cse = await prisma.department.create({
          data: { name: "computer science and engineering", department_code: "CSE" }
      });
  }
  
  let ece = await prisma.department.findFirst({
    where: {
        OR: [
            { name: "electronics and communication engineering" },
            { department_code: "ECE" }
        ]
    }
  });

  if (!ece) {
      ece = await prisma.department.create({
          data: { name: "electronics and communication engineering", department_code: "ECE" }
      });
  }

  const students = [
    {
      name: "Alice FirstYear",
      email: "alice.s1@example.com",
      student_phone_number: "9911000001",
      dateOfBirth: new Date("2005-01-01"),
      gender: "female",
      currentSemester: 1,
      program: "btech",
      departmentId: cse.id,
      allotted_branch: "computer science and engineering",
      last_institution: "High School A",
      qualifying_exam_name: "HSE",
      qualifying_exam_register_no: "REG001",
      status: "approved",
      admission_number: "ADM001",
      password: "password123",
      religion: "Hindu",
      mother_tongue: "English",
      permanent_address: "123 Street, City",
      contact_address: "123 Street, City",
      state_of_residence: "Kerala",
      aadhaar_number: "111122223331"
    },
    {
      name: "Bob FourthSem",
      email: "bob.s4@example.com",
      student_phone_number: "9944000004",
      dateOfBirth: new Date("2004-01-01"),
      gender: "male",
      currentSemester: 4,
      program: "btech",
      departmentId: ece.id,
      allotted_branch: "electronics and communication engineering",
      last_institution: "High School B",
      qualifying_exam_name: "HSE",
      qualifying_exam_register_no: "REG002",
      status: "approved",
      admission_number: "ADM004",
      password: "password123",
      religion: "Christian",
      mother_tongue: "English",
      permanent_address: "456 Street, City",
      contact_address: "456 Street, City",
      state_of_residence: "Kerala",
      aadhaar_number: "444455556664"
    },
    {
        name: "Charlie FourthSem",
        email: "charlie.s4@example.com",
        student_phone_number: "9944000005",
        dateOfBirth: new Date("2004-02-01"),
        gender: "male",
        currentSemester: 4,
        program: "btech",
        departmentId: cse.id,
        allotted_branch: "computer science and engineering",
        last_institution: "High School C",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG003",
        status: "approved",
        admission_number: "ADM005",
        password: "password123",
        religion: "Hindu",
        mother_tongue: "English",
        permanent_address: "789 Street, City",
        contact_address: "789 Street, City",
        state_of_residence: "Kerala",
        aadhaar_number: "777788889995"
      },
      {
        name: "Daisy FirstYear",
        email: "daisy.s1@example.com",
        student_phone_number: "9911000002",
        dateOfBirth: new Date("2005-02-01"),
        gender: "female",
        currentSemester: 1,
        program: "btech",
        departmentId: ece.id,
        allotted_branch: "electronics and communication engineering",
        last_institution: "High School D",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG004",
        status: "approved",
        admission_number: "ADM002",
        password: "password123",
        religion: "Muslim",
        mother_tongue: "English",
        permanent_address: "321 Street, City",
        contact_address: "321 Street, City",
        state_of_residence: "Kerala",
        aadhaar_number: "333322221112"
      },
      // Additional S1 Students
      {
        name: "Ethan FirstSem",
        email: "ethan.s1@example.com",
        student_phone_number: "9911000010",
        dateOfBirth: new Date("2005-03-10"),
        gender: "male",
        currentSemester: 1,
        program: "btech",
        departmentId: cse.id,
        allotted_branch: "computer science and engineering",
        last_institution: "High School E",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG010",
        status: "approved",
        admission_number: "ADM010",
        password: "password123",
        religion: "Christian",
        mother_tongue: "English",
        permanent_address: "101 Ave, City",
        contact_address: "101 Ave, City",
        state_of_residence: "Kerala",
        aadhaar_number: "101010101010"
      },
      {
        name: "Fiona FirstSem",
        email: "fiona.s1@example.com",
        student_phone_number: "9911000011",
        dateOfBirth: new Date("2005-04-11"),
        gender: "female",
        currentSemester: 1,
        program: "btech",
        departmentId: ece.id,
        allotted_branch: "electronics and communication engineering",
        last_institution: "High School F",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG011",
        status: "approved",
        admission_number: "ADM011",
        password: "password123",
        religion: "Hindu",
        mother_tongue: "Malayalam",
        permanent_address: "102 Ave, City",
        contact_address: "102 Ave, City",
        state_of_residence: "Kerala",
        aadhaar_number: "111111111111"
      },
      {
        name: "George FirstSem",
        email: "george.s1@example.com",
        student_phone_number: "9911000012",
        dateOfBirth: new Date("2005-05-12"),
        gender: "male",
        currentSemester: 1,
        program: "btech",
        departmentId: cse.id,
        allotted_branch: "computer science and engineering",
        last_institution: "High School G",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG012",
        status: "approved",
        admission_number: "ADM012",
        password: "password123",
        religion: "Muslim",
        mother_tongue: "English",
        permanent_address: "103 Ave, City",
        contact_address: "103 Ave, City",
        state_of_residence: "Kerala",
        aadhaar_number: "121212121212"
      },

      // Additional S4 Students
      {
        name: "Hannah FourthSem",
        email: "hannah.s4@example.com",
        student_phone_number: "9944000020",
        dateOfBirth: new Date("2004-06-20"),
        gender: "female",
        currentSemester: 4,
        program: "btech",
        departmentId: ece.id,
        allotted_branch: "electronics and communication engineering",
        last_institution: "High School H",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG020",
        status: "approved",
        admission_number: "ADM020",
        password: "password123",
        religion: "Christian",
        mother_tongue: "English",
        permanent_address: "201 Blvd, City",
        contact_address: "201 Blvd, City",
        state_of_residence: "Kerala",
        aadhaar_number: "202020202020"
      },
      {
        name: "Ian FourthSem",
        email: "ian.s4@example.com",
        student_phone_number: "9944000021",
        dateOfBirth: new Date("2004-07-21"),
        gender: "male",
        currentSemester: 4,
        program: "btech",
        departmentId: cse.id,
        allotted_branch: "computer science and engineering",
        last_institution: "High School I",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG021",
        status: "approved",
        admission_number: "ADM021",
        password: "password123",
        religion: "Hindu",
        mother_tongue: "Malayalam",
        permanent_address: "202 Blvd, City",
        contact_address: "202 Blvd, City",
        state_of_residence: "Kerala",
        aadhaar_number: "212121212121"
      },
      {
        name: "Jack FourthSem",
        email: "jack.s4@example.com",
        student_phone_number: "9944000022",
        dateOfBirth: new Date("2004-08-22"),
        gender: "male",
        currentSemester: 4,
        program: "btech",
        departmentId: ece.id,
        allotted_branch: "electronics and communication engineering",
        last_institution: "High School J",
        qualifying_exam_name: "HSE",
        qualifying_exam_register_no: "REG022",
        status: "approved",
        admission_number: "ADM022",
        password: "password123",
        religion: "Muslim",
        mother_tongue: "English",
        permanent_address: "203 Blvd, City",
        contact_address: "203 Blvd, City",
        state_of_residence: "Kerala",
        aadhaar_number: "222222222222"
      }
  ];

  for (const s of students) {
    const exists = await prisma.student.findFirst({ where: { email: s.email } });
    if (!exists) {
      await prisma.student.create({ data: s as any });
      console.log(`Created student: ${s.name} (S${s.currentSemester})`);
    } else {
      console.log(`Student already exists: ${s.name}`);
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
