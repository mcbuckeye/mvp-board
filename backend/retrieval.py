from __future__ import annotations

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from embedding import embed_single
from models import AdvisorChunk, AdvisorDocument


async def retrieve_context(
    db: AsyncSession,
    advisor_id: str,
    question: str,
    top_k: int = 5,
) -> list[dict]:
    """Retrieve the top_k most relevant chunks for a given advisor and question.

    Returns list of dicts with keys: chunk_text, document_title, similarity
    """
    # Check if this advisor has any chunks at all (fast short-circuit)
    count_result = await db.execute(
        select(AdvisorChunk.id).where(AdvisorChunk.advisor_id == advisor_id).limit(1)
    )
    if count_result.scalar_one_or_none() is None:
        return []

    # Embed the question
    question_embedding = await embed_single(question)
    embedding_str = "[" + ",".join(str(x) for x in question_embedding) + "]"

    # Query for most similar chunks using pgvector cosine distance
    stmt = text("""
        SELECT c.chunk_text, c.document_id, 1 - (c.embedding <=> :embedding::vector) AS similarity
        FROM advisor_chunks c
        WHERE c.advisor_id = :advisor_id
          AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> :embedding::vector
        LIMIT :top_k
    """)

    result = await db.execute(
        stmt,
        {"advisor_id": advisor_id, "embedding": embedding_str, "top_k": top_k},
    )
    rows = result.fetchall()

    if not rows:
        return []

    # Fetch document titles
    doc_ids = list({row[1] for row in rows})
    doc_result = await db.execute(
        select(AdvisorDocument.id, AdvisorDocument.title).where(AdvisorDocument.id.in_(doc_ids))
    )
    doc_titles = {row[0]: row[1] for row in doc_result.fetchall()}

    return [
        {
            "chunk_text": row[0],
            "document_title": doc_titles.get(row[1], "Unknown"),
            "similarity": float(row[2]),
        }
        for row in rows
    ]


def format_rag_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context block for injection into advisor prompts."""
    if not chunks:
        return ""

    lines = ["[RELEVANT CONTEXT FROM YOUR WRITINGS]"]
    for chunk in chunks:
        title = chunk["document_title"]
        text_snippet = chunk["chunk_text"].strip()
        lines.append(f'From "{title}": "{text_snippet}"')
    lines.append("[END CONTEXT]")
    lines.append("")
    lines.append("When your response is informed by the above context, cite the source in brackets like [Source Title].")
    return "\n".join(lines)
