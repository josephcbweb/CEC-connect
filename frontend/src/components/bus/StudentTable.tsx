interface Student {
  id: number;
  name: string;
  student_phone_number: string;
  department: {
    name: string;
  };
  stopName: string;
  stopFee: number;
}

const StudentTable = ({ students }: { students: Student[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="text-gray-400 text-sm uppercase tracking-wider">
          <th className="pb-4 font-medium">Name</th>
          <th className="pb-4 font-medium">Department</th>
          <th className="pb-4 font-medium">Bus Stop</th>
          <th className="pb-4 font-medium">Contact</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {students.map((student) => (
          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-4 font-medium text-gray-700">{student.name}</td>

            <td className="py-4 text-gray-600">
              {student.department?.name ?? "N/A"}
            </td>

            <td className="py-4 text-gray-600">
              {student.stopName || "Not Assigned"}
            </td>

            <td className="py-4 text-gray-600">
              {student.student_phone_number}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default StudentTable;
