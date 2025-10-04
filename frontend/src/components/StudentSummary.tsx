// components/StudentSummary.tsx
import React from "react";

interface StudentSummaryProps {
  title: string;
  count: number;
}

const StudentSummary: React.FC<StudentSummaryProps> = ({ title, count }) => {
  return (
    <div className="flex flex-col justify-between h-full p-4 bg-white rounded">
      <h1 className="text-[1rem] font-semibold break-words">{title}</h1>
      <p className="text-xl text-[#3AA9AB] mt-auto">{count}</p>
    </div>
  );
};

export default StudentSummary;
