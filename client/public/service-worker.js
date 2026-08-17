self.addEventListener("push", (event) => {
    if (!event.data) {
        return;
    }

    const data = event.data.json();

    const title = data.title || "TBCare";

    const options = {
        body: data.body || "Ada pengingat baru.",
        icon: "/logo.png",
        badge: "/logo.png",
        data: {
            url: "/dashboard",
        },
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});

self.addEventListener(
    "notificationclick",
    (event) => {
        event.notification.close();

        event.waitUntil(
            clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            }).then((clientList) => {
                for (const client of clientList) {
                    if ("focus" in client) {
                        client.focus();
                        return;
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(
                        "/dashboard"
                    );
                }
            })
        );
    }
);