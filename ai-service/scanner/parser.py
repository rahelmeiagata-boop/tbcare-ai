"""Mengubah teks hasil OCR resep menjadi daftar obat terstruktur.

Yang dikenali (konvensi resep di Indonesia):
  R/ Rifampisin 450 mg   No. XXX      -> nama, kekuatan, jumlah (Romawi/angka)
  S 3 dd 1 pc                         -> 3 kali sehari, 1 tablet, sesudah makan
  3x1 | 1-0-1 | tiap 8 jam | 2x sehari -> frekuensi
  selama 14 hari | 2 bulan            -> durasi

Prinsip: parser hanya MENGUSULKAN. Setiap nilai yang tidak terbaca dibiarkan
kosong (None), bukan ditebak, dan hasil akhir selalu dikonfirmasi pasien.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .matcher import DrugEntry, DrugMatcher, Mention

# Batas pada form obat aplikasi (pilihan 1x-4x sehari).
MAX_FREQUENCY = 4
# Berapa baris setelah nama obat yang masih dianggap bagian dari obat tsb.
MAX_FOLLOWING_LINES = 3
# Baris OCR dengan keyakinan di bawah ini ditandai perlu dicek.
LOW_LINE_CONFIDENCE = 60.0

SCHEDULE_LABELS = {
    "before_breakfast": "Sebelum Sarapan",
    "after_breakfast": "Sesudah Sarapan",
    "before_lunch": "Sebelum Makan Siang",
    "after_lunch": "Sesudah Makan Siang",
    "before_dinner": "Sebelum Makan Malam",
    "after_dinner": "Sesudah Makan Malam",
    "before_sleep": "Sebelum Tidur",
}
MEAL_RULE_TEXT = {
    "before": "Sebelum makan",
    "after": "Sesudah makan",
    "during": "Saat makan",
    "sleep": "Sebelum tidur",
}

# ----------------------------------------------------------------- angka
_WORD_NUMBERS = {"satu": 1, "sekali": 1, "dua": 2, "tiga": 3, "empat": 4, "lima": 5, "enam": 6}
_ROMAN = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100}


def roman_to_int(text: str) -> int | None:
    text = text.lower()
    if not text or any(ch not in _ROMAN for ch in text):
        return None
    total = 0
    for i, ch in enumerate(text):
        value = _ROMAN[ch]
        if i + 1 < len(text) and _ROMAN[text[i + 1]] > value:
            total -= value
        else:
            total += value
    return total


def to_int(token: str | None) -> int | None:
    """Angka Arab, kata ("tiga") atau angka Romawi ("XXX") -> int."""
    if token is None:
        return None
    t = token.strip().lower().strip(".,")
    if t.isdigit():
        return int(t)
    if t in ("l", "|"):  # angka 1 yang terbaca OCR sebagai huruf l / garis tegak
        return 1
    if t in _WORD_NUMBERS:
        return _WORD_NUMBERS[t]
    return roman_to_int(t)


# ----------------------------------------------------------------- regex
_RE_MARKER = re.compile(r"^\s*r\s*[/\\|7:]\s*", re.I)

# Baris pembuka bagian lain pada resep (identitas pasien, alamat, dll.).
_RE_SECTION_STOP = re.compile(
    r"^\s*(?:pro\b|ny\.|tn\.|nn\.|an\.|umur|usia|alamat|jl\.|jalan|tgl|tanggal|sip\b|apotek|paraf|iter|dokter|dr\.)",
    re.I,
)

_RE_STRENGTH = re.compile(
    r"(\d{1,4}(?:[.,]\d+)?(?:\s*/\s*\d{1,4}(?:[.,]\d+)?){0,3})\s*"
    r"(mg|mcg|ug|µg|gram|gr|g|ml|iu|ui|rng|mq|m9)(?![a-z])"
)
_UNIT_MAP = {"rng": "mg", "mq": "mg", "m9": "mg", "gr": "g", "gram": "g", "ug": "mcg", "µg": "mcg", "ui": "IU", "iu": "IU"}

_PER_DOSE = r"(\d+(?:[.,]\d+)?|1/2|[ivxl|]{1,3}(?![a-z]))"
_FORM = r"(?:tablet|tab|tb|kaps(?:ul)?|caps?)"

# "3 dd 1", "3 d.d. tab 1", "S.3.d.d.1"
_RE_DD = re.compile(
    r"(?<![a-z0-9])(\d+|[ivxl|]{1,3})\s*\.?\s*d\s*\.?\s*d(?![a-z])\.?"
    r"(?:\s*" + _FORM + r"\.?)?(?:\s*" + _PER_DOSE + r")?"
)
# "3 x sehari", "tiga kali sehari", "sekali sehari", "2x/hari"
_RE_SEHARI = re.compile(
    r"(?<![a-z0-9])(\d+|[ivx]{1,3}|satu|dua|tiga|empat|sekali)\s*(?:x|kali)?\s*(?:sehari|/\s*hari|per\s*hari)"
)
_RE_SEHARI_REV = re.compile(r"sehari\s*(\d+|satu|dua|tiga|empat)\s*(?:x|kali)")
# "3x1", "3 x 1/2"
_RE_TIMES = re.compile(r"(?<![\d.,/])(\d)\s*x\s*(\d|1/2)(?![\d])")
# "1-0-1", "1-1-1-1"
_RE_DASH = re.compile(r"(?<![\d-])(\d)\s*-\s*(\d)\s*-\s*(\d)(?:\s*-\s*(\d))?(?![\d-])")
# "tiap 8 jam", "q8h"
_RE_INTERVAL = re.compile(r"(?:tiap|setiap|per|q)\s*(\d{1,2})\s*(?:jam|j|h)(?![a-z])")
_RE_LATIN_FREQ = re.compile(r"(?<![a-z])(qd|od|bid|bd|tid|tds|qid|qds)(?![a-z])")
_LATIN_FREQ = {"qd": 1, "od": 1, "bid": 2, "bd": 2, "tid": 3, "tds": 3, "qid": 4, "qds": 4}
_RE_UNITS_PER_DOSE = re.compile(r"(?<![\d.,/])(\d{1,2})\s*" + _FORM + r"(?![a-z])")

_RE_DURATION = re.compile(r"(?<![\d])(\d{1,3})\s*(hari|hr|minggu|mgg|bulan|bln)(?![a-z])")
_DURATION_DAYS = {"hari": 1, "hr": 1, "minggu": 7, "mgg": 7, "bulan": 30, "bln": 30}

_RE_QTY = re.compile(r"(?<![a-z])(?:no|n0|jml|jumlah|isi|#)\s*[.:,]?\s*([ivxlc]{1,8}|\d{1,4})(?![a-z0-9])")
_RE_QTY_UNITS = re.compile(r"(?<![\d.,/])(\d{2,4})\s*(?:tablet|tab|tb|kaps(?:ul)?|caps?|butir|biji)(?![a-z])")

_RE_BEFORE = re.compile(
    r"(?<![a-z])a\.?\s?c\.?(?![a-z])|sebelum\s+(?:makan|sarapan)|sblm\s+makan|(?:perut|lambung)\s+kosong"
)
_RE_AFTER = re.compile(
    r"(?<![a-z])p\.?\s?c\.?(?![a-z])|(?:sesudah|setelah|sehabis|stlh|ssdh)\s+(?:makan|sarapan)"
)
_RE_DURING = re.compile(r"(?<![a-z])d\.?\s?c\.?(?![a-z])|saat\s+makan|bersama\s+makan|pada\s+waktu\s+makan|sewaktu\s+makan")
_RE_SLEEP = re.compile(r"(?<![a-z])h\.?\s?s\.?(?![a-z])|sebelum\s+tidur|waktu\s+tidur|menjelang\s+tidur")

_TIME_WORDS = (
    ("pagi", re.compile(r"(?<![a-z])(?:pagi|mane)(?![a-z])")),
    ("siang", re.compile(r"(?<![a-z])siang(?![a-z])")),
    ("sore", re.compile(r"(?<![a-z])sore(?![a-z])")),
    ("malam", re.compile(r"(?<![a-z])(?:malam|vesper|nocte)(?![a-z])")),
)

# Karakter yang sering tertukar saat OCR membaca angka (hanya dipakai di sekitar satuan mg/g).
_DIGIT_FIX = str.maketrans({"O": "0", "o": "0", "I": "1", "l": "1", "|": "1", "S": "5", "s": "5", "B": "8"})
_RE_FIXABLE_NUMBER = re.compile(r"(?<![A-Za-z0-9])([0-9OoIlSsB|]{2,5})(?=\s*(?:mg|mcg|g|ml)(?![a-z]))")


# ----------------------------------------------------------------- hasil
@dataclass
class ParsedMedication:
    line_index: int
    source_text: str
    detected_name: str
    name: str
    matched: bool
    match_score: float
    category: str | None
    dosage: str | None = None
    strength_mg: float | None = None
    per_dose: float | None = None
    frequency: int | None = None
    duration_days: int | None = None
    duration_estimated: bool = False
    quantity: int | None = None
    meal_relation: str | None = None
    schedule: list[str] = field(default_factory=list)
    confidence: float = 0.0
    needs_review: bool = False
    issues: list[str] = field(default_factory=list)  # alasan perlu dicek
    notes: list[str] = field(default_factory=list)  # informasi tambahan

    def to_dict(self, index: int) -> dict:
        return {
            "id": index,
            "med_name": self.name,
            "detected_name": self.detected_name,
            "matched": self.matched,
            "match_score": round(self.match_score, 3),
            "category": self.category,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "duration_days": self.duration_days,
            "duration_estimated": self.duration_estimated,
            "stock": self.quantity,
            "per_dose": self.per_dose,
            "consumption_rule": MEAL_RULE_TEXT.get(self.meal_relation or "", ""),
            "consumption_schedule": list(self.schedule),
            "confidence": round(self.confidence, 3),
            "needs_review": self.needs_review,
            "issues": list(self.issues),
            "notes": list(self.notes),
            "source_text": self.source_text,
        }


@dataclass
class ParseResult:
    medications: list[ParsedMedication]

    @property
    def matched_count(self) -> int:
        return sum(1 for m in self.medications if m.matched)


@dataclass
class _Anchor:
    line_idx: int
    mention_start: int  # posisi awal penyebutan / penanda pada baris
    segment_start: int  # posisi awal teks yang menjadi milik obat ini
    mention: Mention | None


# ----------------------------------------------------------------- util teks
def _normalize(text: str) -> str:
    text = text.replace("×", "x").replace("½", "1/2")
    text = re.sub(r"[ \t]+", " ", text)
    return text.lower()


def _fix_digits(text: str) -> str:
    """Perbaiki angka yang terbaca huruf, mis. 'I50 mg' -> '150 mg', '4SO mg' -> '450 mg'."""

    def repl(match: re.Match) -> str:
        token = match.group(1)
        if not any(ch.isdigit() for ch in token):
            return token
        return token.translate(_DIGIT_FIX)

    return _RE_FIXABLE_NUMBER.sub(repl, text)


def _format_number(value: str) -> str:
    return value.replace(",", ".").strip()


def _parse_strength(text: str) -> tuple[str | None, float | None]:
    match = _RE_STRENGTH.search(text)
    if not match:
        return None, None
    raw_value = re.sub(r"\s+", "", match.group(1))
    unit = _UNIT_MAP.get(match.group(2), match.group(2))
    value_text = _format_number(raw_value)
    dosage = f"{value_text} {unit}"

    strength_mg: float | None = None
    if "/" not in value_text:  # kombinasi (FDC) tidak punya satu nilai mg
        try:
            number = float(value_text)
            strength_mg = {"mg": number, "g": number * 1000, "mcg": number / 1000}.get(unit)
        except ValueError:
            strength_mg = None
    return dosage, strength_mg


def _parse_per_dose(token: str | None) -> float | None:
    if not token:
        return None
    token = token.strip().lower()
    if token == "1/2":
        return 0.5
    if token in ("l", "|"):
        return 1.0
    if re.fullmatch(r"\d+(?:[.,]\d+)?", token):
        return float(token.replace(",", "."))
    return to_int(token)


def _parse_frequency(text: str) -> tuple[int | None, float | None, list[str]]:
    """Return (frekuensi per hari, jumlah unit per minum, slot waktu dari pola 1-0-1)."""
    match = _RE_DD.search(text)
    if match:
        return to_int(match.group(1)), _parse_per_dose(match.group(2)), []

    match = _RE_SEHARI.search(text) or _RE_SEHARI_REV.search(text)
    if match:
        return to_int(match.group(1)), None, []

    match = _RE_TIMES.search(text)
    if match:
        freq = int(match.group(1))
        if 1 <= freq <= 6:
            return freq, _parse_per_dose(match.group(2)), []

    match = _RE_DASH.search(text)
    if match:
        parts = [int(g) for g in match.groups() if g is not None]
        slots_all = ["pagi", "siang", "malam", "tidur"]
        slots = [slots_all[i] for i, value in enumerate(parts) if value > 0]
        if slots:
            per = max(parts)
            return len(slots), float(per), slots

    match = _RE_INTERVAL.search(text)
    if match:
        hours = int(match.group(1))
        if hours > 0 and 24 % hours == 0:
            return 24 // hours, None, []

    match = _RE_LATIN_FREQ.search(text)
    if match:
        return _LATIN_FREQ[match.group(1)], None, []

    return None, None, []


def _parse_time_words(text: str) -> list[str]:
    found = []
    for name, pattern in _TIME_WORDS:
        if pattern.search(text):
            found.append(name)
    return found


def _parse_meal_relation(text: str) -> str | None:
    # Urutan penting: "sebelum tidur" harus menang atas "sebelum makan".
    if _RE_SLEEP.search(text):
        return "sleep"
    if _RE_BEFORE.search(text):
        return "before"
    if _RE_AFTER.search(text):
        return "after"
    if _RE_DURING.search(text):
        return "during"
    return None


def _parse_duration(text: str) -> int | None:
    match = _RE_DURATION.search(text)
    if not match:
        return None
    days = int(match.group(1)) * _DURATION_DAYS[match.group(2)]
    return days if 1 <= days <= 730 else None


def _parse_quantity(text: str) -> int | None:
    match = _RE_QTY.search(text)
    if match:
        value = to_int(match.group(1))
        if value is not None and 1 <= value <= 999:
            return value
    match = _RE_QTY_UNITS.search(text)
    if match:
        value = int(match.group(1))
        if value >= 10:
            return value
    return None


def suggest_schedule(
    frequency: int | None,
    relation: str | None,
    time_words: list[str],
    dash_slots: list[str],
) -> tuple[list[str], list[str]]:
    """Usulkan kunci jadwal minum (sama dengan form Obat Saya).

    Hanya mengusulkan bila resep menyebut hubungan dengan makan (ac/pc/dc/hs).
    Tanpa itu, jadwal dibiarkan kosong karena form mewajibkan pasien memilih
    sebelum/sesudah makan dan resep tidak mengatakannya.
    """
    notes: list[str] = []
    if not frequency or not 1 <= frequency <= MAX_FREQUENCY or not relation:
        return [], notes

    if relation == "sleep":
        return (["before_sleep"] if frequency == 1 else []), notes

    prefix = "after" if relation in ("after", "during") else "before"
    if relation == "during":
        notes.append("Aturan 'saat makan' dipetakan ke 'sesudah makan'.")

    slot_map = {"pagi": "breakfast", "siang": "lunch", "sore": "dinner", "malam": "dinner"}
    slots = dash_slots or time_words
    meal_slots: list[str] = []
    for word in slots:
        if word == "tidur":
            continue
        slot = slot_map.get(word)
        if slot and slot not in meal_slots:
            meal_slots.append(slot)

    if len(meal_slots) != frequency:
        defaults = {
            1: ["breakfast"],
            2: ["breakfast", "dinner"],
            3: ["breakfast", "lunch", "dinner"],
            4: ["breakfast", "lunch", "dinner"],
        }
        meal_slots = list(defaults[frequency])
        if frequency == 4:
            keys = [f"{prefix}_{s}" for s in meal_slots] + ["before_sleep"]
            notes.append("Waktu minum disarankan dari aturan pakai; sesuaikan bila perlu.")
            return keys, notes
        notes.append("Waktu minum disarankan dari aturan pakai; sesuaikan bila perlu.")

    return [f"{prefix}_{slot}" for slot in meal_slots], notes


# ----------------------------------------------------------------- parser inti
def _build_anchors(lines: list[str], matcher: DrugMatcher) -> list[_Anchor]:
    anchors: list[_Anchor] = []
    for idx, line in enumerate(lines):
        mentions = matcher.find_mentions(line)
        for mention in mentions:
            anchors.append(_Anchor(idx, mention.char_start, mention.char_end, mention))
        if not mentions:
            marker = _RE_MARKER.match(line)
            if marker:
                anchors.append(_Anchor(idx, marker.start(), marker.end(), None))
    anchors.sort(key=lambda a: (a.line_idx, a.mention_start))
    return anchors


def _segment_text(lines: list[str], anchors: list[_Anchor], i: int) -> str:
    anchor = anchors[i]
    nxt = anchors[i + 1] if i + 1 < len(anchors) else None
    line = lines[anchor.line_idx]

    if nxt is not None and nxt.line_idx == anchor.line_idx:
        return line[anchor.segment_start : nxt.mention_start]

    parts = [line[anchor.segment_start :]]
    last = (nxt.line_idx - 1) if nxt is not None else len(lines) - 1
    last = min(last, anchor.line_idx + MAX_FOLLOWING_LINES)
    for j in range(anchor.line_idx + 1, last + 1):
        if _RE_SECTION_STOP.match(lines[j]):
            break
        parts.append(lines[j])
    return "\n".join(parts)


def _guess_unmatched_name(line: str) -> str:
    """Nama obat yang tidak ada di dataset: teks setelah 'R/' sampai angka pertama."""
    rest = _RE_MARKER.sub("", line, count=1)
    match = re.search(r"\d", rest)
    if match:
        rest = rest[: match.start()]
    name = re.sub(r"[^A-Za-z .\-]", " ", rest)
    name = re.sub(r"\s+", " ", name).strip(" .-")
    return name.title() if name else ""


def parse_lines(lines: list[tuple[str, float]], matcher: DrugMatcher) -> ParseResult:
    """lines: daftar (teks_baris, keyakinan_OCR_0..100)."""
    texts = [_fix_digits(t) for t, _ in lines]
    confs = [c for _, c in lines]
    anchors = _build_anchors(texts, matcher)

    medications: list[ParsedMedication] = []
    for i, anchor in enumerate(anchors):
        segment = _segment_text(texts, anchors, i)
        norm = _normalize(segment)
        line_conf = confs[anchor.line_idx]

        mention = anchor.mention
        if mention is not None:
            entry: DrugEntry | None = mention.entry
            name = entry.name
            detected = mention.text.strip()
            score = mention.score
            category = entry.category
            short_alias = mention.short_alias
        else:
            entry = None
            detected = _guess_unmatched_name(texts[anchor.line_idx])
            name = detected
            score = 0.0
            category = None
            short_alias = False

        dosage, strength_mg = _parse_strength(norm)
        frequency, per_dose, dash_slots = _parse_frequency(norm)
        time_words = _parse_time_words(norm)
        relation = _parse_meal_relation(norm)
        duration = _parse_duration(norm)
        quantity = _parse_quantity(norm)

        if frequency is None and time_words:
            frequency = len(time_words)
        if per_dose is None:
            match = _RE_UNITS_PER_DOSE.search(norm)
            if match and int(match.group(1)) <= 6:
                per_dose = float(match.group(1))

        issues: list[str] = []
        notes: list[str] = []

        # ---- validasi frekuensi terhadap batas aplikasi
        if frequency is not None and not 1 <= frequency <= MAX_FREQUENCY:
            issues.append(
                f"Frekuensi {frequency}x sehari di luar pilihan aplikasi (1-{MAX_FREQUENCY}x). Atur manual."
            )
            frequency = None

        # ---- nama
        if entry is None:
            issues.append("Nama obat tidak ada di dataset obat TBC. Periksa atau ketik ulang nama obat.")
        else:
            # Nama yang dicocokkan tidak persis selalu diminta konfirmasi.
            if score < 1.0 and not short_alias:
                issues.append(
                    f"Nama terbaca '{detected}', dicocokkan ke '{name}' "
                    f"(kemiripan {round(score * 100)}%). Pastikan benar."
                )
            if short_alias:
                issues.append(f"Nama dikenali dari singkatan '{detected}'. Pastikan benar.")

        # ---- dosis
        if dosage is None:
            has_single_strength = entry is None or bool(entry.strengths_mg)
            if has_single_strength or not per_dose:
                issues.append("Dosis (kekuatan mg) tidak terbaca.")
        elif entry is not None and entry.strengths_mg and strength_mg is not None:
            if all(abs(strength_mg - s) > 1e-6 for s in entry.strengths_mg):
                common = ", ".join(f"{int(s) if float(s).is_integer() else s}" for s in entry.strengths_mg)
                issues.append(
                    f"Kekuatan {dosage} tidak umum untuk {name} (umumnya {common} mg). "
                    "Periksa kembali angka pada resep."
                )

        # ---- aturan pakai
        if frequency is None and not any("di luar pilihan" in x for x in issues):
            issues.append("Aturan pakai (berapa kali sehari) tidak terbaca.")

        # ---- keyakinan baris OCR
        if line_conf < LOW_LINE_CONFIDENCE:
            issues.append(f"Teks pada baris ini kurang jelas (keyakinan OCR {round(line_conf)}%).")

        # ---- perkiraan durasi dari jumlah obat (hanya jika tidak tertulis)
        duration_estimated = False
        if duration is None and quantity and frequency and per_dose:
            per_day = frequency * per_dose
            if per_day > 0:
                estimate = round(quantity / per_day)
                if 1 <= estimate <= 365:
                    duration = estimate
                    duration_estimated = True
                    notes.append(
                        f"Durasi {estimate} hari adalah perkiraan dari jumlah obat "
                        f"({quantity}) dibagi pemakaian per hari. Sesuaikan bila perlu."
                    )
        elif duration is None and quantity and frequency and per_dose is None:
            estimate = round(quantity / frequency)
            if 1 <= estimate <= 365:
                duration = estimate
                duration_estimated = True
                notes.append(
                    f"Durasi {estimate} hari adalah perkiraan dari jumlah obat ({quantity}) "
                    f"dengan anggapan 1 unit per minum. Sesuaikan bila perlu."
                )

        # ---- jadwal minum
        schedule, schedule_notes = suggest_schedule(frequency, relation, time_words, dash_slots)
        notes.extend(schedule_notes)
        if frequency and not schedule:
            if relation is None:
                notes.append("Resep tidak menyebut sebelum/sesudah makan. Pilih waktu minum secara manual.")
            else:
                notes.append("Pilih waktu minum secara manual.")

        if quantity is None:
            notes.append("Jumlah obat (stok) tidak terbaca. Isi manual.")
        if duration is None:
            notes.append("Durasi tidak tertulis pada resep. Isi manual.")

        # ---- bentuk string dosis, sertakan jumlah unit per minum bila > 1
        dosage_text = dosage
        if per_dose and (per_dose != 1 or dosage is None) and (dosage is not None or entry is None or not entry.strengths_mg):
            unit_text = f"{per_dose:g} tablet"
            dosage_text = f"{dosage} x {unit_text}" if dosage else unit_text

        # ---- keyakinan (heuristik, bukan probabilitas)
        completeness = sum(x is not None for x in (dosage_text, frequency, quantity or duration)) / 3
        confidence = 0.5 * score + 0.3 * (line_conf / 100.0) + 0.2 * completeness
        if entry is None:
            confidence = min(confidence, 0.4)

        needs_review = bool(issues) or confidence < 0.75

        medications.append(
            ParsedMedication(
                line_index=anchor.line_idx,
                source_text=" | ".join(s.strip() for s in (texts[anchor.line_idx], *segment.split("\n")[1:]) if s.strip())[:400],
                detected_name=detected,
                name=name,
                matched=entry is not None,
                match_score=score,
                category=category,
                dosage=dosage_text,
                strength_mg=strength_mg,
                per_dose=per_dose,
                frequency=frequency,
                duration_days=duration,
                duration_estimated=duration_estimated,
                quantity=quantity,
                meal_relation=relation,
                schedule=schedule,
                confidence=confidence,
                needs_review=needs_review,
                issues=issues,
                notes=notes,
            )
        )

    return ParseResult(medications=_deduplicate(medications))


def _deduplicate(items: list[ParsedMedication]) -> list[ParsedMedication]:
    """Obat yang sama persis (nama, dosis, frekuensi) terbaca dua kali -> ambil yang lebih yakin."""
    best: dict[tuple, ParsedMedication] = {}
    order: list[tuple] = []
    for item in items:
        if not item.matched:
            key = ("unmatched", item.line_index)
        else:
            key = (item.name, item.dosage, item.frequency)
        if key not in best:
            best[key] = item
            order.append(key)
        elif item.confidence > best[key].confidence:
            best[key] = item
    return [best[k] for k in order]
