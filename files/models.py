"""Hợp đồng dữ liệu của hệ thống (nguồn sự thật duy nhất).
Mọi output của LLM và mọi plan đều phải validate qua các model này trước khi vào state (INV-6)."""
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

# ---------- Thang rủi ro ----------
Rating = Literal["low", "medium", "high", "critical"]
RATING_ORDER: list[str] = ["low", "medium", "high", "critical"]


def rating_value(r: str) -> int:
    return RATING_ORDER.index(r)


# ---------- Expert (định nghĩa 1 chuyên gia) ----------
class ExpertSpec(BaseModel):
    id: str = Field(pattern=r"^[a-z_]+$")
    name: str
    cognitive_style: str            # cách tư duy: lập luận từ đâu, ưu tiên gì
    personality: str                # giọng điệu, khẩu vị rủi ro, cách phản biện
    role: str                       # vai trò, phạm vi chuyên môn (mô tả)
    kb_namespace: str               # "kb:<id>", chỉ expert này được đọc
    forbidden: list[str] = []       # điều tuyệt đối không làm (dùng cho prompt VÀ để test)


# ---------- Plan ----------
class Assignment(BaseModel):
    expert: str
    role: Literal["primary", "consulted"]


class ReviewPolicy(BaseModel):
    mode: Literal["none", "cross"] = "none"
    max_rounds: int = Field(0, ge=0, le=3)


class Policy(BaseModel):
    review: ReviewPolicy = ReviewPolicy()


class Component(BaseModel):
    id: str = Field(pattern=r"^C\d+$")
    name: str
    depends_on: list[str] = []
    assignments: list[Assignment] = Field(min_length=1)
    policy: Policy = Policy()


class EscalateIf(BaseModel):
    confidence_below: float = Field(ge=0, le=1)
    rating_spread_at_least: int = Field(ge=1, le=3)
    status: Optional[Literal["insufficient_info"]] = None


class Rules(BaseModel):
    synthesis: Literal["keep_dissent"]
    escalate_if: EscalateIf
    max_retries_per_task: int = Field(ge=0, le=5)


class Plan(BaseModel):
    plan_version: int = Field(ge=1)
    source: str                      # "template:<tên>" hoặc "llm" (plan do LLM sinh bắt buộc người duyệt)
    components: list[Component] = Field(min_length=1)
    rules: Rules

    @model_validator(mode="after")
    def structural_checks(self):
        ids = [c.id for c in self.components]
        if len(set(ids)) != len(ids):
            raise ValueError("id cấu phần bị trùng")
        for c in self.components:
            for d in c.depends_on:
                if d not in ids:
                    raise ValueError(f"{c.id} phụ thuộc {d} không tồn tại")
            primaries = [a.expert for a in c.assignments if a.role == "primary"]
            if not primaries:
                raise ValueError(f"{c.id} chưa có primary")
            if len(set(primaries)) != len(primaries):
                raise ValueError(f"{c.id} có primary trùng")
            r = c.policy.review
            if r.mode == "cross" and (len(primaries) < 2 or r.max_rounds < 1):
                raise ValueError(f"{c.id}: review cross cần >=2 primary và max_rounds >= 1")
        indeg = {c.id: len(c.depends_on) for c in self.components}      # Kahn: phát hiện chu trình
        queue, seen = [i for i, n in indeg.items() if n == 0], 0
        while queue:
            cur = queue.pop()
            seen += 1
            for c in self.components:
                if cur in c.depends_on:
                    indeg[c.id] -= 1
                    if indeg[c.id] == 0:
                        queue.append(c.id)
        if seen != len(ids):
            raise ValueError("đồ thị phụ thuộc có chu trình")
        return self


# ---------- Kết quả của chuyên gia ----------
class Evidence(BaseModel):
    src: Literal["usecase", "kb"]    # tài liệu use case hay KB riêng của expert
    ref: str                         # ví dụ "doc3#p12"


class Assessment(BaseModel):
    expert: str
    component: str
    rating: Optional[Rating] = None
    rationale: str
    evidence: list[Evidence] = []
    confidence: float = Field(ge=0, le=1)
    would_change_if: str = ""
    mitigations: list[str] = []
    status: Literal["ok", "insufficient_info", "failed"] = "ok"

    @model_validator(mode="after")
    def ok_needs_rating_and_evidence(self):
        if self.status == "ok" and self.rating is None:
            raise ValueError("status=ok cần rating")
        if self.status == "ok" and not self.evidence:
            raise ValueError("status=ok cần ít nhất một bằng chứng")
        return self


class Review(BaseModel):
    expert: str
    component: str
    round: int = Field(ge=1)
    decision: Literal["keep", "revise"]
    rating: Rating                   # rating sau phản biện
    confidence: float = Field(ge=0, le=1)
    rationale: str


# ---------- Tổng hợp ----------
class SynthesisDraft(BaseModel):     # phần do Synthesizer (LLM) sinh; code mới quyết định phần còn lại
    final_rating: Rating
    summary: str
    key_reasons: list[str]


class ExpertView(BaseModel):
    expert: str
    rating: Rating
    confidence: float
    rationale: str


class HumanOverride(BaseModel):
    original: Optional[Rating]
    note: str = ""


class Synthesis(BaseModel):          # thứ được lưu vào state và truyền xuống cấu phần sau
    component: str
    status: Literal["ok", "incomplete"]
    final_rating: Optional[Rating]
    summary: str = ""
    key_reasons: list[str] = []
    rating_spread: int = Field(ge=0, le=3)       # do code tính
    confidence_min: float = Field(ge=0, le=1)    # do code tính
    per_expert: list[ExpertView] = []
    dissent: list[ExpertView] = []               # do code tính: ai khác final_rating
    human_override: Optional[HumanOverride] = None


# ---------- Event log (append-only, idempotent theo id) ----------
EventType = Literal[
    "intake_done", "plan_created", "plan_validated", "component_start", "assessment", "assess_done",
    "review", "synthesis", "retry", "escalate", "human_decision", "component_done",
    "budget_warning", "budget_exceeded", "final_review", "run_failed",
]


class Event(BaseModel):
    id: str                           # ổn định, xác định được: "<run>:<component>:<kind>:<expert>"
    ts: float
    run_id: str
    plan_version: Optional[int] = None   # gắn vào mọi event sau khi plan được đóng băng (INV-2)
    type: EventType
    component: Optional[str] = None
    expert: Optional[str] = None
    data: dict = {}                   # chỉ chứa tham chiếu và số liệu, KHÔNG chứa toàn văn tài liệu
