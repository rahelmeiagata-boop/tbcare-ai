import db from "../config/db.js";

import {
  getPushSubscriptionsByUserId
} from "./pushSubscriptionService.js";

import {
  sendPushNotification
} from "./webPushService.js";


const checkMedicationSchedules = async () => {
  try {
    const now = new Date();

    const jakartaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    console.log(
      `⏰ Scheduler cek waktu Jakarta: ${jakartaTime}`
    );


    const [schedules] = await db.execute(
      `
            SELECT
                ms.id AS schedule_id,
                ms.scheduled_time,
                m.id AS medication_id,
                m.med_name,
                m.user_id
            FROM medication_schedules ms
            JOIN medications m
                ON ms.medication_id = m.id
            WHERE TIME_FORMAT(ms.scheduled_time, '%H:%i') = ?
            `,
      [jakartaTime]
    );


    if (schedules.length === 0) {
      return;
    }


    console.log(
      `💊 ${schedules.length} jadwal obat ditemukan.`
    );


    for (const schedule of schedules) {

      const message =
        `Waktunya minum ${schedule.med_name}. ` +
        `Silakan minum obat sesuai jadwal Anda.`;


      const [existing] = await db.execute(
        `
                SELECT id
                FROM notifications
                WHERE user_id = ?
                  AND message = ?
                  AND DATE(created_at) = CURDATE()
                LIMIT 1
                `,
        [
          schedule.user_id,
          message,
        ]
      );


      if (existing.length > 0) {
        console.log(
          `⏭️ Notifikasi ${schedule.med_name} sudah pernah diproses hari ini.`
        );

        continue;
      }


      const subscriptions =
        await getPushSubscriptionsByUserId(
          schedule.user_id
        );


      if (!subscriptions || subscriptions.length === 0) {
        console.log(
          `⚠️ Tidak ada subscription untuk user ${schedule.user_id}.`
        );

        continue;
      }


      let pushSuccess = false;

      for (const sub of subscriptions) {
        console.log(
          `🔎 Mencoba subscription ID ${sub.id} -> user ${schedule.user_id}`
        );

        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const success =
          await sendPushNotification(
            subscription,
            message
          );

        if (success) {
          pushSuccess = true;

          console.log(
            `✅ PUSH NOTIF TERKIRIM: ${schedule.med_name} -> user ${schedule.user_id} -> subscription ${sub.id}`
          );
        } else {
          console.log(
            `❌ PUSH NOTIF GAGAL: ${schedule.med_name} -> user ${schedule.user_id} -> subscription ${sub.id}`
          );
        }
      }


      if (pushSuccess) {

        await db.execute(
          `
                    INSERT INTO notifications
                    (
                        user_id,
                        message,
                        channel,
                        status,
                        is_read
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        'web_push',
                        'terkirim',
                        0
                    )
                    `,
          [
            schedule.user_id,
            message,
          ]
        );


        console.log(
          `🔔 NOTIF OTOMATIS SELESAI: ${schedule.med_name} -> user ${schedule.user_id}`
        );

      } else {

        console.log(
          `⚠️ Notifikasi belum disimpan karena push gagal.`
        );
      }
    }

  } catch (error) {

    console.error(
      "❌ NOTIFICATION SCHEDULER ERROR:",
      error
    );
  }
};


const startNotificationScheduler = () => {

  console.log(
    "🚀 Notification scheduler aktif."
  );


  checkMedicationSchedules();


  setInterval(
    checkMedicationSchedules,
    30 * 1000
  );
};


export default startNotificationScheduler;