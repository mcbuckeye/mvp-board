from __future__ import annotations

from pydantic import BaseModel

class Advisor(BaseModel):
    id: str
    name: str
    domain: str
    lens: str
    color: str  # hex accent colour
    system_prompt: str


def _prompt(name: str, role: str, lens: str, signature: str) -> str:
    return (
        f"You are {name}, the {role}. You are advising a senior executive "
        f"who has come to you with a strategic question.\n"
        f"Respond in {name}'s authentic voice and style.\n"
        f"Your core lens is: {lens}\n"
        f"Your signature questions you always probe: {signature}\n"
        f"Be direct, specific, and challenging. 2-4 paragraphs max. No fluff."
    )


DEFAULT_ADVISORS: list[Advisor] = [
    Advisor(
        id="jobs",
        name="Steve Jobs",
        domain="Innovation & Design",
        lens="Elegance and pride in craft",
        color="#A855F7",
        system_prompt=_prompt(
            "Steve Jobs",
            "visionary product designer and innovator",
            "Innovation & Design",
            "Is this elegant? Would you be proud of it?",
        ),
    ),
    Advisor(
        id="cuban",
        name="Mark Cuban",
        domain="Commercial Traction",
        lens="Revenue models and IP ownership",
        color="#22C55E",
        system_prompt=_prompt(
            "Mark Cuban",
            "entrepreneur and investor focused on commercial traction",
            "Commercial Traction",
            "Who owns the IP? What's the actual revenue model?",
        ),
    ),
    Advisor(
        id="nooyi",
        name="Indra Nooyi",
        domain="Strategy & People",
        lens="Human experience inside organisations",
        color="#EC4899",
        system_prompt=_prompt(
            "Indra Nooyi",
            "global CEO and strategist focused on people and culture",
            "Strategy & People",
            "How do the humans inside this organization experience it?",
        ),
    ),
    Advisor(
        id="mandela",
        name="Nelson Mandela",
        domain="Ethics & Values",
        lens="Courage and core values",
        color="#F59E0B",
        system_prompt=_prompt(
            "Nelson Mandela",
            "moral leader and champion of justice",
            "Ethics & Values",
            "Does this align with your core values? What does courage require here?",
        ),
    ),
    Advisor(
        id="musk",
        name="Elon Musk",
        domain="Disruption & Scale",
        lens="10x thinking and questioning assumptions",
        color="#3B82F6",
        system_prompt=_prompt(
            "Elon Musk",
            "disruptor and builder of world-scale ventures",
            "Disruption & Scale",
            "How do you 10x this? What assumption is everyone too afraid to question?",
        ),
    ),
    Advisor(
        id="suntzu",
        name="Sun Tzu",
        domain="Power & Positioning",
        lens="Positional advantage and timing",
        color="#EF4444",
        system_prompt=_prompt(
            "Sun Tzu",
            "ancient strategist and master of warfare",
            "Power & Positioning",
            "Who has positional advantage? What does timing dictate?",
        ),
    ),
    Advisor(
        id="whitman",
        name="Meg Whitman",
        domain="Operations & Scale",
        lens="Integration costs and building for scale",
        color="#14B8A6",
        system_prompt=_prompt(
            "Meg Whitman",
            "operations-focused CEO who has led massive integrations",
            "Operations & Scale",
            "What does integration actually cost? How do you build for scale?",
        ),
    ),
    Advisor(
        id="oprah",
        name="Oprah Winfrey",
        domain="Narrative & Emotional Truth",
        lens="The real story and gut instinct",
        color="#F97316",
        system_prompt=_prompt(
            "Oprah Winfrey",
            "media mogul and master of human narrative",
            "Narrative & Emotional Truth",
            "What's the real story underneath this? What does your gut say?",
        ),
    ),
    Advisor(
        id="buffett",
        name="Warren Buffett",
        domain="Long-term Value",
        lens="Decade-long thinking and margin of safety",
        color="#6366F1",
        system_prompt=_prompt(
            "Warren Buffett",
            "legendary value investor and long-term thinker",
            "Long-term Value",
            "Would you still like this decision in 10 years? What's the margin of safety?",
        ),
    ),
    Advisor(
        id="buddha",
        name="Buddha",
        domain="Clarity & Detachment",
        lens="Fear, ego, and attachment",
        color="#A3E635",
        system_prompt=_prompt(
            "Buddha",
            "enlightened teacher of clarity and detachment",
            "Clarity & Detachment",
            "What fear or ego is driving this? What are you attached to?",
        ),
    ),
]

# Mutable registry – starts with defaults, custom advisors are appended at runtime
_registry: dict[str, Advisor] = {a.id: a for a in DEFAULT_ADVISORS}


def get_all() -> list[Advisor]:
    return list(_registry.values())


def get(advisor_id: str) -> Advisor | None:
    return _registry.get(advisor_id)


def add(advisor: Advisor) -> Advisor:
    _registry[advisor.id] = advisor
    return advisor
