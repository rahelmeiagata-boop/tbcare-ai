import unittest

from scanner.matcher import DrugMatcher, levenshtein, similarity

# Nama obat yang sudah ada di TB_MEDICINE_OPTIONS (client MedicineContent.jsx).
APP_MEDICINE_NAMES = ["Rifampisin", "Isoniazid", "Pirazinamid", "Etambutol", "Streptomisin", "KDT RH", "KDT RHZE"]


class MatcherTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = DrugMatcher()

    def names(self, line):
        return [x.entry.name for x in self.m.find_mentions(line)]

    def test_dataset_covers_app_medicine_options(self):
        for name in APP_MEDICINE_NAMES:
            self.assertIn(name, self.m.names)

    def test_levenshtein(self):
        self.assertEqual(levenshtein("kitten", "sitting"), 3)
        self.assertEqual(levenshtein("", "abc"), 3)
        self.assertEqual(levenshtein("abc", "abc"), 0)
        self.assertGreater(levenshtein("abcdef", "uvwxyz", max_dist=2), 2)  # berhenti lebih awal
        self.assertAlmostEqual(similarity("rifampisin", "rifampicin"), 0.9)

    def test_exact_and_spelling_variants(self):
        cases = {
            "R/ Rifampisin 450 mg No. XXX": "Rifampisin",
            "Rifampicin 450mg": "Rifampisin",
            "Isoniazid 300 mg": "Isoniazid",
            "ISONIAZID": "Isoniazid",
            "Pyrazinamide 500": "Pirazinamid",
            "Ethambutol 500": "Etambutol",
            "Streptomycin 1 g": "Streptomisin",
            "Levofloxacin 750": "Levofloksasin",
            "Vit B6 10 mg": "Vitamin B6",
            "Vitamin B 6": "Vitamin B6",
            "KDT RHZE 3 tablet": "KDT RHZE",
            "4FDC 3 tab": "KDT RHZE",
            "OAT KDT RH": "KDT RH",
            "Rifampisin450mg": "Rifampisin",  # huruf dan angka menempel
        }
        for line, expected in cases.items():
            with self.subTest(line=line):
                self.assertEqual(self.names(line), [expected])

    def test_tolerates_ocr_errors(self):
        for line, expected in {
            "Rifampisn 450 mg": "Rifampisin",
            "lsoniazid 300 mg": "Isoniazid",
            "Pirazinamld 500": "Pirazinamid",
            "Etambuto1 500": "Etambutol",
        }.items():
            with self.subTest(line=line):
                self.assertEqual(self.names(line), [expected])

    def test_short_abbreviations_exact_only_and_flagged(self):
        mention = self.m.find_mentions("INH 300 mg")[0]
        self.assertEqual(mention.entry.name, "Isoniazid")
        self.assertTrue(mention.short_alias)
        self.assertEqual(self.names("lNH 300"), ["Isoniazid"])  # l <-> I tertukar
        self.assertEqual(self.names("INX 300"), [])  # bukan singkatan yang dikenal
        # 4FDC / RHZE bukan singkatan meragukan
        self.assertFalse(self.m.find_mentions("4FDC")[0].short_alias)
        self.assertFalse(self.m.find_mentions("RHZE")[0].short_alias)

    def test_common_prescription_words_do_not_match(self):
        for line in [
            "dr. Andi Pratama, Sp.P",
            "SIP 123/456/2026",
            "Jl. Merdeka No. 12 Medan",
            "S 3 dd 1 pc",
            "tablet kapsul sehari",
            "Pro: Budi Santoso (35 th)",
            "Paracetamol 500 mg",
            "Amoxicillin 500 mg",
            "Omeprazol 20 mg",
            "Tanggal 12 November 2026",
            "Apotek Sehat Sentosa",
            "tiga kali sehari sesudah makan",
        ]:
            with self.subTest(line=line):
                self.assertEqual(self.names(line), [])

    def test_two_drugs_on_one_line(self):
        self.assertEqual(self.names("Rifampisin 450 mg / Isoniazid 300 mg"), ["Rifampisin", "Isoniazid"])

    def test_aliases_are_unique(self):
        # Konstruktor melempar ValueError bila ada alias ganda antar obat.
        DrugMatcher()


if __name__ == "__main__":
    unittest.main()
