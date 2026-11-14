import unittest

from scanner.matcher import DrugMatcher
from scanner.parser import parse_lines, roman_to_int, to_int


def parse(text, conf=90.0):
    matcher = DrugMatcher()
    result = parse_lines([(line, conf) for line in text.split("\n") if line.strip()], matcher)
    return [m.to_dict(i) for i, m in enumerate(result.medications)]


class ParserTest(unittest.TestCase):
    def test_numbers(self):
        self.assertEqual(roman_to_int("XXX"), 30)
        self.assertEqual(roman_to_int("XC"), 90)
        self.assertEqual(roman_to_int("LX"), 60)
        self.assertEqual(roman_to_int("CXX"), 120)
        self.assertIsNone(roman_to_int("ABC"))
        self.assertEqual(to_int("tiga"), 3)
        self.assertEqual(to_int("7"), 7)
        self.assertEqual(to_int("l"), 1)  # angka 1 terbaca huruf l

    def test_classic_prescription(self):
        meds = parse(
            """dr. Andi Pratama, Sp.P
            R/ Rifampisin 450 mg   No. XXX
               S 1 dd 1 ac
            R/ Pirazinamid 500 mg No. XC
               S 3 dd 1 pc
            Pro: Budi (35 th)"""
        )
        self.assertEqual([m["med_name"] for m in meds], ["Rifampisin", "Pirazinamid"])
        rif, pza = meds
        self.assertEqual((rif["dosage"], rif["frequency"], rif["stock"]), ("450 mg", 1, 30))
        self.assertEqual(rif["consumption_schedule"], ["before_breakfast"])
        self.assertEqual(rif["consumption_rule"], "Sebelum makan")
        self.assertEqual((pza["dosage"], pza["frequency"], pza["stock"]), ("500 mg", 3, 90))
        self.assertEqual(pza["consumption_schedule"], ["after_breakfast", "after_lunch", "after_dinner"])
        self.assertFalse(rif["needs_review"])

    def test_schedule_length_always_matches_frequency_or_is_empty(self):
        # Form obat mewajibkan jumlah jadwal == frekuensi.
        for text in [
            "Isoniazid 300 mg S 1 dd 1 ac",
            "Isoniazid 300 mg S 2 dd 1 pc",
            "Isoniazid 300 mg S 3 dd 1 ac",
            "Isoniazid 300 mg S 4 dd 1 pc",
            "Isoniazid 300 mg 1-0-1",
            "Isoniazid 300 mg 1 dd 1 hs",
            "Isoniazid 300 mg 1 dd 1",
        ]:
            with self.subTest(text=text):
                m = parse(text)[0]
                if m["consumption_schedule"]:
                    self.assertEqual(len(m["consumption_schedule"]), m["frequency"])

    def test_frequency_styles(self):
        cases = {
            "Isoniazid 300 mg 3x1 pc": 3,
            "Isoniazid 300 mg 2 x sehari": 2,
            "Isoniazid 300 mg tiga kali sehari": 3,
            "Isoniazid 300 mg sekali sehari": 1,
            "Isoniazid 300 mg tiap 8 jam": 3,
            "Isoniazid 300 mg tiap 12 jam": 2,
            "Isoniazid 300 mg bid": 2,
            "Isoniazid 300 mg 1-0-1": 2,
            "Isoniazid 300 mg 1-1-1": 3,
            "Isoniazid 300 mg pagi malam": 2,
        }
        for text, freq in cases.items():
            with self.subTest(text=text):
                self.assertEqual(parse(text)[0]["frequency"], freq)

    def test_frequency_above_app_limit_is_not_guessed(self):
        m = parse("Isoniazid 300 mg 6 dd 1")[0]
        self.assertIsNone(m["frequency"])
        self.assertTrue(m["needs_review"])
        self.assertTrue(any("di luar pilihan" in i for i in m["issues"]))

    def test_meal_relations(self):
        self.assertEqual(parse("Isoniazid 300 mg 1 dd 1 ac")[0]["consumption_rule"], "Sebelum makan")
        self.assertEqual(parse("Isoniazid 300 mg 1 dd 1 pc")[0]["consumption_rule"], "Sesudah makan")
        self.assertEqual(parse("Isoniazid 300 mg 1 dd 1 dc")[0]["consumption_rule"], "Saat makan")
        self.assertEqual(parse("Isoniazid 300 mg 1 dd 1 hs")[0]["consumption_schedule"], ["before_sleep"])
        self.assertEqual(parse("Isoniazid 300 mg 1 dd sebelum tidur")[0]["consumption_schedule"], ["before_sleep"])

    def test_no_meal_relation_leaves_schedule_empty(self):
        m = parse("Isoniazid 300 mg 1 dd 1")[0]
        self.assertEqual(m["consumption_schedule"], [])
        self.assertEqual(m["consumption_rule"], "")

    def test_duration_and_estimate(self):
        m = parse("Rifampisin 450 mg 1x1 ac selama 14 hari")[0]
        self.assertEqual(m["duration_days"], 14)
        self.assertFalse(m["duration_estimated"])
        self.assertEqual(parse("Rifampisin 450 mg 1x1 selama 2 bulan")[0]["duration_days"], 60)
        self.assertEqual(parse("Rifampisin 450 mg 1x1 selama 2 minggu")[0]["duration_days"], 14)

        est = parse("Rifampisin 450 mg No. XXX\nS 1 dd 1 ac")[0]
        self.assertEqual(est["duration_days"], 30)
        self.assertTrue(est["duration_estimated"])  # diperkirakan, bukan tertulis

    def test_fixed_dose_combination_has_no_mg(self):
        m = parse("R/ KDT RHZE 3 tablet\n S 1 dd 3 tab ac\n No. XC")[0]
        self.assertEqual(m["med_name"], "KDT RHZE")
        self.assertEqual(m["dosage"], "3 tablet")
        self.assertEqual(m["frequency"], 1)
        self.assertFalse(any("Dosis" in i for i in m["issues"]))

    def test_unusual_strength_is_flagged(self):
        m = parse("R/ Rifampisin 4500 mg No. XXX\n S 1 dd 1")[0]
        self.assertTrue(m["needs_review"])
        self.assertTrue(any("tidak umum" in i for i in m["issues"]))
        # 600 mg adalah kekuatan sediaan yang umum -> tidak ada peringatan "tidak umum"
        common = parse("R/ Rifampisin 600 mg No. XXX\n S 1 dd 1")[0]
        self.assertFalse(any("tidak umum" in i for i in common["issues"]))

    def test_ocr_digit_letter_confusions(self):
        m = parse("R/ Rifampisin 4SO mg No. XXX\n S 1 dd I ac")[0]
        self.assertEqual(m["dosage"], "450 mg")
        m = parse("Isoniazid I00 mg 1 dd 1")[0]
        self.assertEqual(m["dosage"], "100 mg")
        m = parse("R/ Rifampisin 450 mg\n S l dd l ac")[0]
        self.assertEqual(m["frequency"], 1)

    def test_unknown_drug_is_kept_but_flagged(self):
        meds = parse("R/ Paracetamol 500 mg No. X\n S 3 dd 1 prn")
        self.assertEqual(len(meds), 1)
        self.assertFalse(meds[0]["matched"])
        self.assertEqual(meds[0]["med_name"], "Paracetamol")
        self.assertTrue(meds[0]["needs_review"])
        self.assertLessEqual(meds[0]["confidence"], 0.4)

    def test_fuzzy_match_is_reported(self):
        m = parse("R/ Rifampisn 450 mg No. XXX\n S 1 dd 1 ac")[0]
        self.assertEqual(m["med_name"], "Rifampisin")
        self.assertEqual(m["detected_name"], "Rifampisn")
        self.assertLess(m["match_score"], 1.0)
        self.assertTrue(m["needs_review"])  # nama tidak persis -> minta konfirmasi

    def test_low_ocr_confidence_is_flagged(self):
        m = parse("R/ Rifampisin 450 mg No. XXX\n S 1 dd 1 ac", conf=45)[0]
        self.assertTrue(m["needs_review"])

    def test_address_footer_does_not_become_stock(self):
        m = parse("R/ Etambutol 500 mg\n S 2 dd 1 ac\nPro: Budi (35 th)\nJl. Merdeka No. 12 Medan")[0]
        self.assertIsNone(m["stock"])

    def test_missing_fields_are_none_not_guessed(self):
        m = parse("Rifampisin 450 mg")[0]
        self.assertIsNone(m["frequency"])
        self.assertIsNone(m["stock"])
        self.assertIsNone(m["duration_days"])
        self.assertEqual(m["consumption_schedule"], [])

    def test_duplicate_reading_is_merged(self):
        meds = parse("Rifampisin 450 mg 1 dd 1 ac\nRifampisin 450 mg 1 dd 1 ac")
        self.assertEqual(len(meds), 1)

    def test_empty_text(self):
        self.assertEqual(parse("dr. Andi\nSIP 123\nPro: Budi"), [])


if __name__ == "__main__":
    unittest.main()
