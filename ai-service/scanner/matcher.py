"""Pencocokan teks hasil OCR ke dataset obat.

Hasil OCR sering salah satu-dua huruf (mis. "Rifampisn", "lsoniazid").
Karena itu nama dicocokkan dengan jarak Levenshtein ternormalisasi, bukan
dengan kesamaan persis. Singkatan pendek (INH, PZA, ...) hanya dicocokkan
persis agar tidak menghasilkan salah deteksi.
"""
from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from . import config

# Singkatan <= panjang ini hanya boleh cocok persis (tanpa fuzzy).
SHORT_ALIAS_MAX_LEN = 4
# Singkatan <= panjang ini dianggap meragukan (INH, PZA, EMB, ...) sehingga
# hasilnya selalu ditandai "perlu dicek". "4FDC"/"RHZE" tidak termasuk.
AMBIGUOUS_ALIAS_MAX_LEN = 3
# Substitusi karakter yang sering tertukar pada hasil OCR (khusus teks pendek).
_OCR_CONFUSIONS = str.maketrans({"l": "i", "1": "i", "|": "i", "0": "o"})

_TOKEN_RE = re.compile(r"[A-Za-z]+|\d+(?:[.,]\d+)?")


@dataclass(frozen=True)
class DrugEntry:
    name: str
    category: str
    aliases: tuple[str, ...]
    strengths_mg: tuple[float, ...] | None


@dataclass
class Mention:
    """Satu penyebutan obat pada sebuah baris teks."""

    start: int  # indeks token awal (inklusif)
    end: int  # indeks token akhir (eksklusif)
    char_start: int  # posisi karakter awal pada baris
    char_end: int  # posisi karakter akhir pada baris
    text: str  # teks yang terbaca
    entry: DrugEntry
    score: float  # 0..1
    short_alias: bool  # cocok lewat singkatan yang meragukan (<= 3 huruf)


def fold(text: str) -> str:
    """Huruf kecil, tanpa aksen, hanya a-z0-9 (spasi/tanda baca dibuang)."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]", "", text.lower())


def tokenize(line: str) -> list[tuple[str, int, int]]:
    """Pecah baris menjadi token huruf / angka beserta posisinya.

    Huruf dan angka yang menempel dipisah ("Rifampisin450mg" -> 3 token).
    """
    return [(m.group(0), m.start(), m.end()) for m in _TOKEN_RE.finditer(line)]


def levenshtein(a: str, b: str, max_dist: int | None = None) -> int:
    """Jarak edit. Bila max_dist diberikan, berhenti lebih awal dan
    mengembalikan max_dist + 1 jika jaraknya pasti lebih besar."""
    if a == b:
        return 0
    if len(a) < len(b):
        a, b = b, a
    if not b:
        return len(a)
    if max_dist is not None and len(a) - len(b) > max_dist:
        return max_dist + 1

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        row_min = i
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            value = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
            cur.append(value)
            if value < row_min:
                row_min = value
        if max_dist is not None and row_min > max_dist:
            return max_dist + 1
        prev = cur
    return prev[-1]


def similarity(a: str, b: str) -> float:
    longest = max(len(a), len(b))
    if longest == 0:
        return 1.0
    return 1.0 - levenshtein(a, b) / longest


class DrugMatcher:
    def __init__(self, dataset_path: Path | str | None = None, min_similarity: float | None = None):
        self.dataset_path = Path(dataset_path or config.DRUG_DATASET_PATH)
        self.min_similarity = min_similarity if min_similarity is not None else config.FUZZY_MIN_SIMILARITY
        self.version = ""
        self.entries: list[DrugEntry] = []
        # kunci ter-fold -> (entry, apakah singkatan pendek)
        self._keys: dict[str, tuple[DrugEntry, bool]] = {}
        self._load()

    # ------------------------------------------------------------------ load
    def _load(self) -> None:
        with open(self.dataset_path, encoding="utf-8") as fh:
            raw = json.load(fh)

        self.version = str(raw.get("version", ""))
        for item in raw["drugs"]:
            strengths = item.get("typical_strengths_mg")
            entry = DrugEntry(
                name=item["name"],
                category=item.get("category", ""),
                aliases=tuple(item.get("aliases", [])),
                strengths_mg=tuple(float(s) for s in strengths) if strengths else None,
            )
            self.entries.append(entry)

            for label in (entry.name, *entry.aliases):
                key = fold(label)
                if not key:
                    continue
                existing = self._keys.get(key)
                if existing and existing[0] is not entry:
                    raise ValueError(
                        f"Alias '{label}' dipakai ganda oleh '{existing[0].name}' dan '{entry.name}'."
                    )
                self._keys[key] = (entry, len(key) <= SHORT_ALIAS_MAX_LEN)

        # daftar kunci panjang untuk fuzzy matching
        self._fuzzy_keys = [(k, e) for k, (e, short) in self._keys.items() if not short]

    @property
    def names(self) -> list[str]:
        return [e.name for e in self.entries]

    # ----------------------------------------------------------------- match
    def match_candidate(self, text: str) -> tuple[DrugEntry, float, bool] | None:
        """Cocokkan satu kandidat teks. Mengembalikan (entry, skor, singkatan_pendek)."""
        key = fold(text)
        if len(key) < 2:
            return None

        # 1. cocok persis (nama atau alias)
        hit = self._keys.get(key)
        if hit:
            return hit[0], 1.0, hit[1] and len(key) <= AMBIGUOUS_ALIAS_MAX_LEN

        # 2. singkatan pendek: hanya persis, dengan koreksi huruf yang tertukar
        if len(key) <= SHORT_ALIAS_MAX_LEN:
            hit = self._keys.get(key.translate(_OCR_CONFUSIONS))
            if hit and hit[1]:
                return hit[0], 0.9, len(key) <= AMBIGUOUS_ALIAS_MAX_LEN
            return None

        # 3. fuzzy: wajib memuat cukup huruf agar tidak menebak dari angka
        if sum(ch.isalpha() for ch in key) < 4:
            return None

        best: tuple[DrugEntry, float] | None = None
        for alias_key, entry in self._fuzzy_keys:
            longest = max(len(key), len(alias_key))
            max_dist = int(longest * (1.0 - self.min_similarity))
            if abs(len(key) - len(alias_key)) > max_dist:
                continue
            dist = levenshtein(key, alias_key, max_dist)
            if dist > max_dist:
                continue
            score = 1.0 - dist / longest
            if score >= self.min_similarity and (best is None or score > best[1]):
                best = (entry, score)

        if best:
            return best[0], best[1], False
        return None

    def find_mentions(self, line: str, max_ngram: int = 3) -> list[Mention]:
        """Cari semua penyebutan obat pada satu baris (tanpa tumpang tindih)."""
        tokens = tokenize(line)
        candidates: list[Mention] = []

        for n in range(1, max_ngram + 1):
            for i in range(0, len(tokens) - n + 1):
                span = tokens[i : i + n]
                text = " ".join(t[0] for t in span)
                found = self.match_candidate(text)
                if not found:
                    continue
                entry, score, short = found
                candidates.append(
                    Mention(
                        start=i,
                        end=i + n,
                        char_start=span[0][1],
                        char_end=span[-1][2],
                        text=line[span[0][1] : span[-1][2]],
                        entry=entry,
                        score=score,
                        short_alias=short,
                    )
                )

        # Pilih greedy: skor tertinggi, lalu rentang terpanjang; tanpa tumpang tindih.
        candidates.sort(key=lambda m: (-m.score, -(m.end - m.start), m.start))
        chosen: list[Mention] = []
        used: set[int] = set()
        for cand in candidates:
            span_idx = set(range(cand.start, cand.end))
            if span_idx & used:
                continue
            chosen.append(cand)
            used |= span_idx
        chosen.sort(key=lambda m: m.start)
        return chosen
