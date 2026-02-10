export interface Notification {
  id: number;
  title: string;
  description: string;
  targetType: "ALL" | "SEMESTER" | "DEPARTMENT" | "STUDENT";
  targetValue?: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: "draft" | "published" | "archived" | "read" | "unread";
  expiryDate?: string;
  createdAt: string;
  sender?: {
      username: string;
      email: string;
  }
}

const API_URL = "http://localhost:3000/api/notifications";

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  create: async (data: Omit<Notification, "id" | "createdAt" | "sender">): Promise<Notification> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create notification");
    return res.json();
  },

  update: async (id: number, data: Partial<Notification>): Promise<Notification> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update notification");
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete notification");
  },

  getMyNotifications: async (): Promise<Notification[]> => {
    const token = localStorage.getItem("studentAuthToken");
    const res = await fetch(`${API_URL}/my-notifications`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Failed to fetch student notifications");
    return res.json();
  }
};
