import { successResponse } from "../utils/response.js";

export const getDashboard = async (req, res) => {

    const dashboard = {
        patientName: "Demo Patient",
        adherence: 94,
        todayMedicine: 4,
        completedMedicine: 3,
        nextReminder: "20:00"
    };

    successResponse(
        res,
        "Dashboard berhasil diambil",
        dashboard
    );

};