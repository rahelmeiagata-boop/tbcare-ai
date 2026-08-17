import api from "./api";

export const sendReminder = async (
    userId,
    message
) => {
    const response = await api.post(
        "/notification",
        {
            user_id: userId,
            message,
        }
    );

    return response.data;
};

export const getNotifications = async () => {
    const response = await api.get(
        "/notification"
    );

    return response.data;
};

export const markNotificationAsRead = async (
    notificationId
) => {
    const response = await api.patch(
        `/notification/${notificationId}/read`
    );

    return response.data;
};