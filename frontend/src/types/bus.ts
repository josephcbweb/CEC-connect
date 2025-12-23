interface BusStop {
  id: number;
  stopName: string;
  feeAmount: number;
}

interface Student {
  id: number;
  name: string;
  admission_number: string | null;
  student_phone_number: string;
  department: {
    name: string;
  };
}

interface BusDetails {
  busId: number;
  busName: string | null;
  busNumber: string;
  capacity: number;
  numberOfStudents: number;
  registrationNumber: string | null;
  driverName: string;
  driverPhone: string;
  status: "Active" | "Inactive";
  stops: BusStop[];
  students: Student[];
}
