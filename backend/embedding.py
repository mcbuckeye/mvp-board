from __future__ import annotations

import os
import uuid
from typing import Any

import tiktoken
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from models import AdvisorChunk, AdvisorDocument

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 500  # tokens
CHUNK_OVERLAP = 50  # tokens


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into ~chunk_size token chunks with overlap."""
    enc = tiktoken.encoding_for_model("gpt-4o")
    tokens = enc.encode(text)
    chunks: list[str] = []
    start = 0
    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        start += chunk_size - overlap
    return chunks


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using OpenAI text-embedding-3-small."""
    if not texts:
        return []
    resp = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in resp.data]


async def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    results = await embed_texts([text])
    return results[0]


async def chunk_and_embed_document(
    db: AsyncSession,
    document: AdvisorDocument,
) -> list[AdvisorChunk]:
    """Chunk a document, embed all chunks, and store them in the database."""
    chunks_text = chunk_text(document.content)
    if not chunks_text:
        return []

    # Embed in batches of 50 to stay within API limits
    all_embeddings: list[list[float]] = []
    batch_size = 50
    for i in range(0, len(chunks_text), batch_size):
        batch = chunks_text[i : i + batch_size]
        embeddings = await embed_texts(batch)
        all_embeddings.extend(embeddings)

    chunk_records: list[AdvisorChunk] = []
    for idx, (text, embedding) in enumerate(zip(chunks_text, all_embeddings)):
        chunk = AdvisorChunk(
            id=uuid.uuid4().hex,
            document_id=document.id,
            advisor_id=document.advisor_id,
            chunk_text=text,
            chunk_index=idx,
            embedding=embedding,
        )
        db.add(chunk)
        chunk_records.append(chunk)

    await db.commit()
    return chunk_records
