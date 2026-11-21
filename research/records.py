"""Validate source records and extract the exact supplied source span."""
from datetime import date
from difflib import SequenceMatcher
from re import fullmatch
import unicodedata
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints, model_validator

Text = Annotated[str, StringConstraints(min_length=1, max_length=20000, pattern=r"\S")]
Reference = Annotated[str, StringConstraints(pattern=r"^[1-9][0-9]{0,5}[a-z]?$")]
COLLECTIONS = {"bukhari": "Sahih al-Bukhari", "muslim": "Sahih Muslim",
               "riyadussalihin": "Riyad as-Salihin"}
Category = Literal["Forgiveness", "Guidance", "Gratitude", "Anxiety and hardship",
                   "Protection", "Parents and family", "Knowledge", "Wellbeing",
                   "This life and the Hereafter"]


class SourceRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    collection: Literal["bukhari", "muslim", "riyadussalihin"]
    reference: Reference
    source_url: Text
    source_arabic: Text
    excerpt: Text
    title: Text
    context: Text
    verified_at: date
    categories: list[Category]
    translation: Text | None = None
    translation_attribution: Text | None = None
    translation_rights: Text | None = None
    transliteration: Text | None = None
    authenticity_grade: Text | None = None
    grading_authority: Text | None = None
    grading_disputed: bool = False
    underlying_source_url: Text | None = None
    uncertainties: list[Text] = Field(default_factory=list)

    @property
    def id(self):
        return f"hadith-{self.collection}-{self.reference}"

    @property
    def arabic(self):
        start = self.source_arabic.index(self.excerpt)
        return self.source_arabic[start:start + len(self.excerpt)]

    @model_validator(mode="after")
    def validate_source(self):
        if self.source_url != f"https://sunnah.com/{self.collection}:{self.reference}":
            raise ValueError("Use the matching canonical Sunnah.com hadith URL.")
        if not self.excerpt.strip() or self.source_arabic.count(self.excerpt) != 1:
            raise ValueError("The exact excerpt must appear once in the source narration.")
        if not normalized_arabic(self.excerpt):
            raise ValueError("The excerpt must contain Arabic letters.")
        if not self.categories or len(self.categories) != len(set(self.categories)):
            raise ValueError("Select at least one topic and use each topic once.")
        if self.verified_at > date.today():
            raise ValueError("Source verification date cannot be in the future.")
        if bool(self.authenticity_grade) != bool(self.grading_authority):
            raise ValueError("A grade and its named authority must be supplied together.")
        if bool(self.translation) != bool(self.translation_attribution and self.translation_rights):
            raise ValueError("An English translation requires attribution and a reuse basis.")
        if not self.translation and (self.translation_attribution or self.translation_rights):
            raise ValueError("Translation metadata requires an English translation.")
        if self.collection == "riyadussalihin":
            if not fullmatch(r"https://sunnah\.com/(bukhari|muslim):[1-9][0-9]{0,5}[a-z]?",
                             self.underlying_source_url or ""):
                raise ValueError("Supply the underlying Bukhari or Muslim hadith URL.")
        elif self.underlying_source_url:
            raise ValueError("Underlying source applies to Riyad as-Salihin records.")
        return self


def normalized_arabic(text):
    """Comparison only. Never use the normalized string for display."""
    return "".join(char for char in unicodedata.normalize("NFKD", text)
                   if char.isalpha() and "ARABIC" in unicodedata.name(char, "")
                   and char != "ـ")


class Narration(BaseModel):
    model_config = ConfigDict(extra="forbid")

    collection: Literal["bukhari", "muslim"]
    reference: Reference
    source_url: Text
    source_arabic: Text

    @model_validator(mode="after")
    def validate_url(self):
        if self.source_url != f"https://sunnah.com/{self.collection}:{self.reference}":
            raise ValueError("Use the matching canonical Sunnah.com hadith URL.")
        if not normalized_arabic(self.source_arabic):
            raise ValueError("The narration must include Arabic text.")
        return self

    @property
    def id(self):
        return f"hadith-{self.collection}-{self.reference}"


class DiscoveryCandidate(Narration):
    retrieved_at: AwareDatetime
    source_provider: Text
    extraction_method: Text
    title: Text
    excerpt: Text | None = None
    categories: list[Category]
    context: Text
    unverified_english_explanation: Text
    uncertainties: list[Text]

    @property
    def arabic(self):
        if self.excerpt and self.source_arabic.count(self.excerpt) == 1:
            if normalized_arabic(self.excerpt):
                return self.excerpt
        return ""

    @property
    def needs_correction(self):
        return not self.arabic

    @model_validator(mode="after")
    def flag_invalid_excerpt(self):
        if self.needs_correction:
            warning = "The proposed excerpt must occur exactly once and contain Arabic letters."
            if warning not in self.uncertainties:
                self.uncertainties.append(warning)
        return self


def possible_variants(record, others):
    key = normalized_arabic(record.arabic)
    matches = []
    if not key:
        return matches
    for other in others:
        if other.id == record.id:
            continue
        other_key = normalized_arabic(other.arabic)
        if not other_key:
            continue
        if key == other_key:
            matches.append({"id": other.id, "match": "same normalized wording"})
        elif SequenceMatcher(None, key, other_key, autojunk=False).ratio() >= 0.80:
            matches.append({"id": other.id, "match": "similar wording; compare narrations"})
    return matches
