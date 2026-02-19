import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, ArrowLeft } from "lucide-react";
import {
  type Notification,
  notificationService,
} from "../../../services/notificationService";
import NotificationModal from "./NotificationModal";

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<
    Notification | undefined
  >(undefined);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await notificationService.delete(id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (n: Notification) => {
    setEditingNotification(n);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNotification(undefined);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            Create and manage broadcast notifications for students
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Create Notification
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No notifications found. Create one to get started.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{n.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {n.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {n.targetType === "ALL" ? "All Students" : n.targetType}
                        {n.targetValue ? ` (${n.targetValue})` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          n.priority === "URGENT"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : n.priority === "IMPORTANT"
                              ? "bg-orange-50 text-orange-700 border-orange-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {n.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          n.status === "published"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : n.status === "archived"
                              ? "bg-gray-100 text-gray-700 border-gray-100"
                              : "bg-yellow-50 text-yellow-700 border-yellow-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            n.status === "published"
                              ? "bg-green-500"
                              : n.status === "archived"
                                ? "bg-gray-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(n)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NotificationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={loadNotifications}
        notification={editingNotification}
      />
    </div>
  );
}
