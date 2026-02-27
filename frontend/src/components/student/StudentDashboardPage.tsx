import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { type FeeStructure, type Invoice, type Student } from "../../types";
import { AlertCircle, Bell, Calendar, BadgeAlert } from "lucide-react";
import {
  notificationService,
  type Notification,
} from "../../services/notificationService";

const PriorityBadge = ({ priority }: { priority: string }) => {
  let colorClass = "bg-blue-500";

  if (priority === "URGENT") {
    colorClass = "bg-red-500 animate-pulse";
  } else if (priority === "IMPORTANT") {
    colorClass = "bg-orange-500 animate-pulse";
  }

  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${colorClass}`}
      title={priority}
    ></span>
  );
};

interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}

const StudentDashboardPage: React.FC = () => {
  const { studentData, isRegistrationOpen } = useOutletContext<{
    studentData: StudentWithFees;
    isRegistrationOpen: boolean;
  }>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getMyNotifications();
        // The service returns sorted data from backend (createdAt desc)
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
      <p className="mt-1 text-lg text-gray-600">
        Welcome back, {studentData.name}.
      </p>
      <div className="mt-8 p-6 bg-white border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">Quick Overview</h2>
        <p className="mt-2 text-gray-700">
          This is your main dashboard. Important announcements, upcoming
          deadlines, and quick links will be displayed here.
        </p>
      </div>
      {isRegistrationOpen && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">
              No Due Status Open
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              Registration for the upcoming semester is now open. Please
              complete your registration to initiate the No Due clearance
              process.
            </p>
            <a
              href="/student/register"
              className="inline-block mt-2 text-sm font-medium text-blue-800 hover:underline"
            >
              Check No Due Status &rarr;
            </a>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          Notifications
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-gray-500">No new notifications for you.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={n.priority} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {n.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
