#!/usr/bin/env python3
"""
AI Assistant for Easy Hit development (Tactical Card RPG).
Optimized for AI agent usage with cost tracking, caching, and structured output.

Asistente senior de diseño de juegos por turnos con memoria semántica
híbrida (ChromaDB + cache local) y seguimiento de costos de API.

Usage:
  # One-shot query with RAG + cost tracking:
  python ai_assistant.py "tu pregunta" --cost

  # Indexar archivo/directorio en ChromaDB:
  python ai_assistant.py --index engine.js
  python ai_assistant.py --index ./tests

  # Buscar en memoria sin llamar a la API:
  python ai_assistant.py --search "regla de balance 7400" --json

  # Modo chat interactivo:
  python ai_assistant.py --chat --system "Eres un diseñador de juegos senior"

  # Modo ultra-económico (gpt-4o-mini, sin RAG):
  python ai_assistant.py "pregunta rápida" --minimal

  # Solo desde caché (sin gastar API):
  python ai_assistant.py "pregunta repetida" --cache-only

  # Re-indexar todo el proyecto Easy Hit:
  python ai_assistant.py --reindex
"""

import os
import sys
import json
import time
import uuid
import hashlib
import signal
import tempfile
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Any
import ast
import re
import tiktoken

from openai import OpenAI, OpenAIError
from chromadb.utils import embedding_functions
import chromadb

# --- CONFIGURACIÓN ---
DEFAULT_MODEL = "gpt-4o-mini"
FAST_MODEL = "gpt-4o-mini"
DEEP_MODEL = "gpt-4o"
API_KEY_ENV = "OPENAI_API_KEY"
DATA_DIR = Path(os.getenv("AI_ASSISTANT_DATA_DIR", str(Path.home() / ".ai_assistant")))
ARCHIVO_MEMORIA = DATA_DIR / "memory.json"
CACHE_FILE = DATA_DIR / "response_cache.json"
COST_HISTORY_FILE = DATA_DIR / "cost_history.json"
CHROMA_DIR = DATA_DIR / "chroma_db"

# Límites de ahorro
MAX_CONTEXT_CHARS = 12000
CHUNK_MAX_CHARS = 3000       # text-embedding-3-small ventana 8192 tokens ≈ 28K chars
EMBEDDING_MAX_CHARS = 3000   # truncado para embedding (seguro dentro de los 8K tokens)
CHROMA_BATCH_SIZE = 100
MAX_CACHE_AGE_DAYS = 30
CHUNKER_VERSION = 2
EMBEDDING_MODEL = "text-embedding-3-small"

# Límites de contexto para OpenAI
MODEL_MAX_TOKENS: dict[str, int] = {
    "gpt-5.5": 128000,
    "gpt-5": 128000,
    "gpt-4.1": 128000,
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
}
RESPONSE_RESERVE_TOKENS = 2000  # tokens reservados para la respuesta
MAX_SAFE_INPUT_TOKENS = 96000   # ~75% del límite, margen de seguridad

# Costos por millón de tokens (USD, aprox Sep 2024+)
MODEL_COST: dict[str, dict[str, float]] = {
    "gpt-5.5":   {"input": 10.00, "output": 30.00},
    "gpt-5":     {"input": 10.00, "output": 30.00},
    "gpt-4.1":   {"input": 2.00,  "output": 8.00},
    "gpt-4o":    {"input": 2.50,  "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}

logger = logging.getLogger("ai_assistant")

# --- Utilidades de encoding y entorno ---

def smart_read_text(path: Path) -> str:
    """Lee un archivo detectando encoding: UTF-8 → UTF-16 (BOM) → locale preferido."""
    # Detectar BOM para UTF-16
    raw_start = path.read_bytes()[:4]
    if raw_start[:2] in (b'\xff\xfe', b'\xfe\xff'):
        try:
            return path.read_text(encoding="utf-16")
        except (UnicodeDecodeError, LookupError):
            pass
    if raw_start[:3] == b'\xef\xbb\xbf':
        try:
            return path.read_text(encoding="utf-8-sig")
        except UnicodeDecodeError:
            pass
    # Intentar UTF-8
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        pass
    # Fallback al encoding del sistema (cp1252 en Windows, utf-8 en Linux/Mac)
    import locale
    sys_enc = locale.getpreferredencoding(do_setlocale=False) or "utf-8"
    try:
        return path.read_text(encoding=sys_enc)
    except (UnicodeDecodeError, LookupError):
        pass
    # Último recurso: ignorar errores
    return path.read_text(encoding="utf-8", errors="replace")


def load_env_file(path: Path) -> dict[str, str]:
    """Carga un archivo .env y devuelve dict clave→valor (solo variables capitalizadas)."""
    env: dict[str, str] = {}
    if not path.exists():
        return env
    try:
        texto = smart_read_text(path)
        for linea in texto.splitlines():
            linea = linea.strip()
            if not linea or linea.startswith("#"):
                continue
            if "=" not in linea:
                continue
            clave, _, valor = linea.partition("=")
            clave = clave.strip()
            valor = valor.strip()
            # Remover comillas simples/dobles
            if len(valor) >= 2 and valor[0] == valor[-1] in ('"', "'"):
                valor = valor[1:-1]
            if clave.isupper() or "_" in clave:
                env[clave] = valor
    except Exception:
        pass
    return env


def resolve_project_path(p: str) -> Path:
    """Resuelve una ruta: primero contra CWD, luego contra el directorio del script."""
    candidate = Path(p)
    if candidate.exists():
        return candidate.resolve()
    # Relativo al directorio raíz del proyecto
    script_dir = Path(__file__).resolve().parent  # directorio raíz (engine.js, ui.js, ...)
    candidate2 = script_dir / p
    if candidate2.exists():
        return candidate2.resolve()
    # Devolver la original por si el caller quiere manejarlo
    return candidate.resolve() if candidate.is_absolute() else Path.cwd() / candidate


# --- Registry de modelos ---
MODEL_CONFIGS: dict[str, dict[str, Any]] = {
    "gpt-5.5":     {"supports_temperature": False, "token_param": "max_completion_tokens"},
    "gpt-5":       {"supports_temperature": False, "token_param": "max_completion_tokens"},
    "gpt-4.1":     {"supports_temperature": True,  "token_param": "max_tokens"},
    "gpt-4o":      {"supports_temperature": True,  "token_param": "max_tokens"},
    "gpt-4o-mini": {"supports_temperature": True,  "token_param": "max_tokens"},
    "gpt-4-turbo": {"supports_temperature": True,  "token_param": "max_tokens"},
}

DEFAULT_MODEL_CONFIG = MODEL_CONFIGS["gpt-4o"]


def get_model_config(model_name: str) -> dict[str, Any]:
    for prefix, config in MODEL_CONFIGS.items():
        if model_name.startswith(prefix):
            return config
    return DEFAULT_MODEL_CONFIG


def get_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = MODEL_COST.get(model, MODEL_COST["gpt-4o"])
    return (input_tokens / 1_000_000 * rates["input"]) + (output_tokens / 1_000_000 * rates["output"])


def build_model_params(model: str, max_tokens: int, temperature: float | None = None) -> dict[str, Any]:
    config = get_model_config(model)
    params: dict[str, Any] = {"model": model, config["token_param"]: max_tokens}
    if config["supports_temperature"] and temperature is not None:
        params["temperature"] = temperature
    return params


# --- Escritura atómica ---
def atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", delete=False, dir=path.parent, encoding="utf-8") as tmp:
        json.dump(data, tmp, ensure_ascii=False, indent=2)
        tmp.flush()
        os.fsync(tmp.fileno())
        temp_name = tmp.name
    os.replace(temp_name, path)


def safe_signal(sig_name: str, handler) -> None:
    sig = getattr(signal, sig_name, None)
    if sig is not None:
        signal.signal(sig, handler)


# --- Cache de respuestas (evita llamadas repetidas) ---
class ResponseCache:
    def __init__(self):
        self.file = CACHE_FILE
        self.data: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        if self.file.exists():
            try:
                with open(self.file, encoding="utf-8") as f:
                    raw = json.load(f)
                    now = time.time()
                    for k, v in raw.items():
                        age_days = (now - v.get("ts", 0)) / 86400
                        if age_days <= MAX_CACHE_AGE_DAYS:
                            self.data[k] = v
            except Exception:
                self.data = {}

    @staticmethod
    def _make_key(prompt: str, model: str) -> str:
        normalized = ' '.join(prompt.lower().split())
        return hashlib.sha256(f"{model}:{normalized}".encode()).hexdigest()

    def get(self, prompt: str, model: str) -> str | None:
        key = self._make_key(prompt, model)
        entry = self.data.get(key)
        if entry:
            return entry.get("response")
        return None

    def set(self, prompt: str, response: str, model: str, tokens_in: int = 0, tokens_out: int = 0) -> None:
        key = self._make_key(prompt, model)
        self.data[key] = {
            "response": response,
            "model": model,
            "ts": time.time(),
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
        }
        self._flush()

    def _flush(self) -> None:
        try:
            atomic_write_json(self.file, self.data)
        except Exception:
            pass


# --- ChromaDB (Memoria Semántica con chunking y dedup) ---
class SemanticMemory:
    def __init__(self, path: str | None = None):
        db_path = path or str(CHROMA_DIR)
        self.client = chromadb.PersistentClient(path=db_path)
        api_key = os.environ.get(API_KEY_ENV, "")
        self.embedding_func = embedding_functions.OpenAIEmbeddingFunction(
            api_key=api_key,
            model_name=EMBEDDING_MODEL,
        )
        existing = [c.name for c in self.client.list_collections()]
        if "easy_hit_memory" in existing:
            col = self.client.get_collection(name="easy_hit_memory")
            meta = col.metadata or {}
            if meta.get(self.EMBEDDING_VERSION_KEY) != EMBEDDING_MODEL:
                print(f"[!] Embedding model cambiado a '{EMBEDDING_MODEL}' — reindexando...")
                self.client.delete_collection("easy_hit_memory")
                self.collection = self.client.create_collection(
                    name="easy_hit_memory", embedding_function=self.embedding_func,
                    metadata={self.EMBEDDING_VERSION_KEY: EMBEDDING_MODEL},
                )
                source_dir = Path(__file__).resolve().parent
                if source_dir.exists():
                    self.index_directory(source_dir)
            else:
                self.collection = col
        else:
            self.collection = self.client.create_collection(
                name="easy_hit_memory", embedding_function=self.embedding_func,
                metadata={self.EMBEDDING_VERSION_KEY: EMBEDDING_MODEL},
            )

    def add_memory(self, doc_id: str, text: str, metadata: dict | None = None) -> None:
        data = metadata or {"source": "agent_history", "created_at": datetime.now(timezone.utc).isoformat()}
        if len(text) > EMBEDDING_MAX_CHARS:
            logger.warning("Truncando memoria de %d a %d chars", len(text), EMBEDDING_MAX_CHARS)
        truncated = text[:EMBEDDING_MAX_CHARS]
        self.collection.upsert(documents=[truncated], metadatas=[data], ids=[doc_id])

    def add_memories_batch(self, memories: list[dict]) -> None:
        for i in range(0, len(memories), CHROMA_BATCH_SIZE):
            batch = memories[i : i + CHROMA_BATCH_SIZE]
            self.collection.upsert(
                ids=[m["id"] for m in batch],
                documents=[m["text"][:EMBEDDING_MAX_CHARS] for m in batch],
                metadatas=[m.get("metadata", {"source": "agent_history"}) for m in batch],
            )

    def retrieve(self, query: str, n_results: int = 5) -> list[tuple[str, dict, float]]:
        """Retorna (documento, metadata, distancia) re-rankeados. Distancia menor = más relevante."""
        if self.collection.count() == 0:
            return []
        n = min(n_results * 2, self.collection.count())  # pedir extra para rerank
        results = self.collection.query(query_texts=[query], n_results=n, include=["documents", "metadatas", "distances"])
        if not results.get("documents"):
            return []
        docs = results["documents"][0] or []
        metas = results["metadatas"][0] or [{}] * len(docs)
        dists = results.get("distances", [[None]])[0] or [None] * len(docs)
        raw = list(zip(docs, metas, dists))
        return self._rerank(raw, query)[:n_results]

    @staticmethod
    def _rerank(results: list[tuple[str, dict, float]], query: str) -> list[tuple[str, dict, float]]:
        if not results:
            return []
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        scored: list[tuple[float, str, dict, float]] = []
        for doc, meta, dist in results:
            doc_lower = doc.lower()
            dist_score = 1.0 - (dist / 2.0) if dist is not None else 0.0
            terms_found = sum(1 for t in query_terms if t in doc_lower)
            kw_score = terms_found / len(query_terms) if query_terms else 0.0
            first_line = doc_lower.split('\n')[0] if doc_lower else ''
            header_boost = 0.2 if any(t in first_line for t in query_terms) else 0.0
            combined = 0.5 * dist_score + 0.35 * kw_score + 0.15 * header_boost
            scored.append((combined, doc, meta, dist))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [(doc, meta, dist) for _, doc, meta, dist in scored]

    @staticmethod
    def _format_context(results: list[tuple[str, dict, float]]) -> str:
        """Formatea resultados RAG con headers file-aware [file.py:L1-L30] y grouping por archivo."""
        if not results:
            return ""
        groups: dict[str, list[tuple[int, int, str]]] = {}
        for doc, meta, _ in results:
            src = meta.get("source", "?")
            sl = meta.get("start_line", 0)
            el = meta.get("end_line", 0)
            if src not in groups:
                groups[src] = []
            groups[src].append((sl, el, doc))
        parts = []
        for src, entries in groups.items():
            entries.sort(key=lambda x: x[0])
            merged: list[tuple[str, int, int]] = []
            for sl, el, doc in entries:
                if merged and sl <= merged[-1][2] + 1:
                    prev_text, prev_sl, prev_el = merged[-1]
                    merged[-1] = (prev_text + '\n' + doc, prev_sl, max(prev_el, el))
                else:
                    merged.append((doc, sl, el))
            for doc_text, sl, el in merged:
                header = f"[{src}:L{sl}-L{el}]"
                parts.append(f"{header}\n{doc_text}")
        return "\n\n".join(parts)

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        """Para --search: devuelve dicts completos con metadatos y score."""
        raw = self.retrieve(query, n_results)
        return [
            {"text": t, "metadata": m, "score": round(d, 4) if d is not None else None}
            for t, m, d in raw
        ]

    def index_file(self, filepath: Path) -> int:
        """Indexa un archivo de texto en ChromaDB con chunking."""
        try:
            content = smart_read_text(filepath)
        except Exception:
            return 0
        content = self._sanitize_text(content)
        return self._index_text(content, str(filepath))

    def index_directory(self, dirpath: Path, pattern: str = "*.py,*.md,*.txt,*.json,*.yml,*.yaml,*.toml,*.cfg,*.ini,*.env*,*.ts,*.tsx,*.js,*.jsx,*.css,*.html") -> int:
        # Pre-coleccionar archivos para mostrar progreso
        exts = [e.strip() for e in pattern.split(",")]
        files: list[Path] = []
        for ext in exts:
            files.extend(fp for fp in dirpath.rglob(ext) if fp.is_file())
        total = len(files)
        if total == 0:
            return 0
        count = 0
        for idx, fp in enumerate(files, 1):
            count += self.index_file(fp)
            # Mostrar progreso cada 10 archivos o al final
            if idx % 10 == 0 or idx == total:
                print(f"\r[Progreso] {idx}/{total} archivos indexados ({count} chunks)   ", end="", flush=True)
        print()
        return count

    def _index_text(self, text: str, source: str) -> int:
        chunks = self._chunk_code(text, source)
        memories = []
        now = datetime.now(timezone.utc).isoformat()
        for chunk_text, start_line, end_line in chunks:
            if not chunk_text.strip():
                continue
            cid = hashlib.sha256(f"{source}:{start_line}:{end_line}:v{CHUNKER_VERSION}".encode()).hexdigest()
            memories.append({
                "id": cid,
                "text": chunk_text,
                "metadata": {
                    "source": source,
                    "start_line": start_line,
                    "end_line": end_line,
                    "total_chunks": len(chunks),
                    "chunker_version": CHUNKER_VERSION,
                    "created_at": now,
                },
            })
        if memories:
            self.add_memories_batch(memories)
        return len(memories)

    @staticmethod
    def _sanitize_text(text: str) -> str:
        patterns = [
            (re.compile(r"(SECRET_KEY\s*=\s*).+", re.I), r"\1[REDACTED]"),
            (re.compile(r"(PASSWORD\s*=\s*).+", re.I), r"\1[REDACTED]"),
            (re.compile(r"(DATABASE_URL\s*=\s*).+", re.I), r"\1[REDACTED]"),
            (re.compile(r"(API_KEY\s*=\s*).+", re.I), r"\1[REDACTED]"),
            (re.compile(r"sk-[a-zA-Z0-9]{20,}"), "[REDACTED_API_KEY]"),
            (re.compile(r"ghp_[a-zA-Z0-9]{36}"), "[REDACTED_GITHUB_TOKEN]"),
        ]
        for pattern, replacement in patterns:
            text = pattern.sub(replacement, text)
        return text

    def _chunk_code(self, text: str, source: str) -> list[tuple[str, int, int]]:
        """Returns list of (chunk_text, start_line, end_line). 1-indexed lines."""
        if source.endswith('.py'):
            try:
                return self._chunk_python_ast(text)
            except SyntaxError:
                pass
        return self._chunk_lines(text)

    def _chunk_python_ast(self, text: str) -> list[tuple[str, int, int]]:
        tree = ast.parse(text)
        lines = text.splitlines()
        chunks: list[tuple[str, int, int]] = []
        buffered: list[tuple[int, int]] = []

        def flush():
            nonlocal buffered
            if not buffered:
                return
            s = buffered[0][0]
            e = buffered[-1][1]
            chunk = '\n'.join(lines[s - 1:e])
            if chunk.strip():
                chunks.append((chunk, s, e))
            buffered = []

        for node in ast.iter_child_nodes(tree):
            start = getattr(node, 'lineno', 1)
            end = getattr(node, 'end_lineno', start)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                flush()
                chunk = '\n'.join(lines[start - 1:end])
                if chunk.strip():
                    if len(chunk) > CHUNK_MAX_CHARS:
                        sub = self._chunk_lines('\n'.join(lines[start - 1:end]))
                        for sc, sl, el in sub:
                            chunks.append((sc, start + sl - 1, start + el - 1))
                    else:
                        chunks.append((chunk, start, end))
            else:
                buffered.append((start, end))

        flush()
        return chunks if chunks else [(text[:CHUNK_MAX_CHARS], 1, len(lines))]

    @staticmethod
    def _chunk_lines(text: str) -> list[tuple[str, int, int]]:
        lines = text.splitlines()
        if not lines or not text.strip():
            return []
        chunks: list[tuple[str, int, int]] = []
        i = 0
        while i < len(lines):
            char_len = 0
            j = i
            while j < len(lines):
                line_len = len(lines[j]) + 1
                if char_len + line_len > CHUNK_MAX_CHARS:
                    break
                char_len += line_len
                j += 1
            if j <= i:
                j = i + 1
            chunk = '\n'.join(lines[i:j])
            if chunk.strip():
                chunks.append((chunk, i + 1, j))
            advance = max(1, j - i - 3)
            i += advance
        return chunks

    EMBEDDING_VERSION_KEY = "embedding_model"

    def reindex_all(self) -> int:
        """Elimina la colección y re-indexa todo el proyecto Easy Hit desde cero."""
        try:
            self.client.delete_collection("easy_hit_memory")
        except ValueError:
            pass  # no existe aún
        self.collection = self.client.get_or_create_collection(
            name="easy_hit_memory", embedding_function=self.embedding_func,
            metadata={self.EMBEDDING_VERSION_KEY: EMBEDDING_MODEL},
        )
        source_dir = Path(__file__).resolve().parent
        if source_dir.exists():
            return self.index_directory(source_dir)
        return 0

    def check_embedding_version(self) -> bool:
        """Retorna True si la colección existe y usa el embedding model actual."""
        try:
            meta = self.collection.metadata or {}
            return meta.get(self.EMBEDDING_VERSION_KEY) == EMBEDDING_MODEL
        except ValueError:
            return False

    def stats(self) -> dict:
        return {"total_documents": self.collection.count()}


# --- Aplicación Principal ---
class EasyHitAssistant:
    def __init__(self, args):
        self.args = args
        self._client: OpenAI | None = None
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.cache = ResponseCache()
        self.memoria_semantica = SemanticMemory()
        self.historial: list[dict[str, str]] = []
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.cost_history = self._load_cost_history()

        safe_signal("SIGINT", self.manejador_cierre)
        safe_signal("SIGTERM", self.manejador_cierre)
        safe_signal("SIGBREAK", self.manejador_cierre)

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            key = os.environ.get(API_KEY_ENV)
            if not key:
                raise ValueError(f"API key missing. Set {API_KEY_ENV} environment variable.")
            self._client = OpenAI(api_key=key, timeout=120)
        return self._client

    def _effective_model(self) -> str:
        return FAST_MODEL if self.args.minimal else self.args.model

    def _use_rag(self) -> bool:
        return not self.args.minimal and not self.args.no_rag

    def cargar_contexto_json(self) -> str:
        if ARCHIVO_MEMORIA.exists():
            try:
                with open(ARCHIVO_MEMORIA, encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("resumen", "Sin historial previo válido.")
            except (json.JSONDecodeError, KeyError):
                return "Sin historial previo válido."
        return "Sin historial previo."

    def guardar_memoria_json(self) -> None:
        if not self.historial:
            return
        print("\n[WAIT] Sintetizando sesion en memory.json...")
        ventana = self._build_context_window()
        if not ventana:
            return

        model = FAST_MODEL
        system_prompt = (
            "Eres un diseñador de juegos senior experto en diseño de combate por turnos. "
            "Destila la conversación en un resumen ejecutivo "
            "con estas secciones:\n"
            "## Mecánicas y Reglas\n## Balance y Ajustes Numéricos\n## Pendientes y Próximos Pasos\n## Decisiones de Diseño\n"
            "Descarta saludos, charlas triviales o redundancias."
        )
        content = "\n".join(f"[{m['role']}]: {m['content']}" for m in ventana)

        kwargs: dict[str, Any] = dict(model=model, messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content},
        ])
        kwargs.update(build_model_params(model, min(self.args.max_tokens, 2048), self.args.temperature))
        try:
            response = self.client.chat.completions.create(**kwargs)
            resumen = response.choices[0].message.content or ""
            usage = response.usage
            if usage:
                self.total_input_tokens += usage.prompt_tokens
                self.total_output_tokens += usage.completion_tokens
                self.cost_history["total_input_tokens"] += usage.prompt_tokens
                self.cost_history["total_output_tokens"] += usage.completion_tokens
                self.cost_history["total_cost_usd"] += get_cost(model, usage.prompt_tokens, usage.completion_tokens)
                self.cost_history["runs"].append({
                    "ts": time.time(),
                    "model": model,
                    "input_tokens": usage.prompt_tokens,
                    "output_tokens": usage.completion_tokens,
                })
                self._save_cost_history()
            atomic_write_json(ARCHIVO_MEMORIA, {"resumen": resumen, "updated_at": datetime.now(timezone.utc).isoformat()})
            print("[OK] Memoria guardada.")
        except Exception as e:
            print(f"[ERROR] al guardar memoria: {e}")

    def _build_context_window(self) -> list[dict[str, str]]:
        selected, total = [], 0
        for msg in reversed(self.historial):
            size = len(msg.get("content", ""))
            if total + size > MAX_CONTEXT_CHARS:
                break
            selected.append(msg)
            total += size
        return list(reversed(selected))

    def _load_cost_history(self) -> dict:
        if COST_HISTORY_FILE.exists():
            try:
                with open(COST_HISTORY_FILE, encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"runs": [], "total_input_tokens": 0, "total_output_tokens": 0, "total_cost_usd": 0.0}

    def _save_cost_history(self) -> None:
        try:
            atomic_write_json(COST_HISTORY_FILE, self.cost_history)
        except Exception:
            pass

    def _count_tokens(self, messages: list[dict]) -> int:
        try:
            enc = tiktoken.encoding_for_model(self._effective_model())
            total = 0
            for msg in messages:
                total += 4
                for value in msg.values():
                    total += len(enc.encode(str(value)))
            total += 2
            return total
        except Exception:
            total_chars = sum(len(str(v)) for m in messages for v in m.values())
            return total_chars // 4

    def _truncate_messages(self, messages: list[dict]) -> list[dict]:
        max_tokens = MODEL_MAX_TOKENS.get(self._effective_model(), MAX_SAFE_INPUT_TOKENS)
        limit = max_tokens - RESPONSE_RESERVE_TOKENS
        total = self._count_tokens(messages)
        if total <= limit:
            return messages
        truncated = [messages[0]] if messages and messages[0]["role"] == "system" else []
        for msg in messages[len(truncated):]:
            proposed = truncated + [msg]
            if self._count_tokens(proposed) <= limit:
                truncated.append(msg)
            else:
                room = limit - self._count_tokens(truncated) - 4
                if room > 0:
                    try:
                        enc = tiktoken.encoding_for_model(self._effective_model())
                        tokens = enc.encode(msg["content"])
                        if len(tokens) > room:
                            truncated.append({**msg, "content": enc.decode(tokens[:room]) + " [truncated]"})
                        else:
                            truncated.append(msg)
                    except Exception:
                        char_room = room * 4
                        if len(msg["content"]) > char_room:
                            truncated.append({**msg, "content": msg["content"][:char_room] + " [truncated]"})
                        else:
                            truncated.append(msg)
                break
        logger.warning("Truncated %d→%d messages (%d tokens)", len(messages), len(truncated), self._count_tokens(truncated))
        return truncated

    def manejador_cierre(self, signum=None, frame=None) -> None:
        print("\n⚠️  Cierre abrupto. Guardando costos y cerrando ChromaDB...")
        self._save_cost_history()
        try:
            _ = self.memoria_semantica.collection.count()
        except Exception:
            pass
        sys.exit(0)

    def _show_cost(self) -> None:
        model = self._effective_model()
        cost = get_cost(model, self.total_input_tokens, self.total_output_tokens)
        lifetime_cost = self.cost_history.get("total_cost_usd", 0.0)
        out = {
            "tokens_input": self.total_input_tokens,
            "tokens_output": self.total_output_tokens,
            "model": model,
            "estimated_cost_usd": round(cost, 6),
            "lifetime_cost_usd": round(lifetime_cost, 6),
            "total_input_tokens_all_time": self.cost_history.get("total_input_tokens", 0),
            "total_output_tokens_all_time": self.cost_history.get("total_output_tokens", 0),
        }
        if self.args.json:
            print(json.dumps(out, ensure_ascii=False))
        else:
            print(f"\n[Cost] ${cost:.6f} ({self.total_input_tokens} in / {self.total_output_tokens} out @ {model})")
            print(f"[Lifetime] ${lifetime_cost:.6f} ({self.cost_history.get('total_input_tokens', 0)} in / {self.cost_history.get('total_output_tokens', 0)} out total)")

    def _call_with_retry(self, kwargs: dict, max_retries: int = 3) -> Any:
        last_error = None
        for attempt in range(max_retries):
            try:
                return self.client.chat.completions.create(**kwargs)
            except OpenAIError as e:
                last_error = e
                status = getattr(e, 'status_code', None)
                if status in (429, 500, 502, 503) or "timeout" in str(e).lower():
                    if attempt < max_retries - 1:
                        sleep_time = 2 ** attempt * (1 + (hash(str(time.time())) % 100) / 100)
                        print(f"[RETRY] Intento {attempt + 1} falló ({e}), reintentando en {sleep_time:.1f}s...")
                        time.sleep(sleep_time)
                        continue
                raise
        raise last_error  # type: ignore[misc]

    def ejecutar_peticion(self, messages: list[dict], cache_key: str | None = None) -> str:
        model = self._effective_model()

        # Cache lookup (solo para single-turn, retorna sin print)
        lookup_key = cache_key
        if lookup_key is None and not self.args.chat:
            user_msgs = [m for m in messages if m["role"] == "user"]
            if user_msgs:
                lookup_key = user_msgs[-1]["content"]
        if lookup_key is not None:
            cached = self.cache.get(lookup_key, model)
            if cached is not None:
                return cached

        messages = self._truncate_messages(messages)

        kwargs: dict[str, Any] = dict(model=model, messages=messages)
        kwargs.update(build_model_params(model, self.args.max_tokens, self.args.temperature))
        response = self._call_with_retry(kwargs)
        content = response.choices[0].message.content or ""
        usage = response.usage
        if usage:
            self.total_input_tokens += usage.prompt_tokens
            self.total_output_tokens += usage.completion_tokens
            self.cost_history["total_input_tokens"] += usage.prompt_tokens
            self.cost_history["total_output_tokens"] += usage.completion_tokens
            self.cost_history["total_cost_usd"] += get_cost(model, usage.prompt_tokens, usage.completion_tokens)
            self.cost_history["runs"].append({
                "ts": time.time(),
                "model": model,
                "input_tokens": usage.prompt_tokens,
                "output_tokens": usage.completion_tokens,
            })
            self._save_cost_history()

        # Guardar en caché
        save_key = cache_key or lookup_key
        if save_key is not None and not self.args.chat:
            self.cache.set(save_key, content, model,
                           usage.prompt_tokens if usage else 0,
                           usage.completion_tokens if usage else 0)
        return content

    def modo_chat(self) -> None:
        memoria_resumen = self.cargar_contexto_json()
        print(f"--- Chat [{self._effective_model()}] | exit/quit para salir ---")
        self.historial = [{"role": "system", "content": f"{self.args.system}\n\nCONTEXTO: {memoria_resumen}"}]
        while True:
            try:
                try:
                    user_input = input("\n[You]: ")
                except EOFError:
                    print("\n[EOF] No input available — exiting chat mode.")
                    self.guardar_memoria_json()
                    if self.args.cost:
                        self._show_cost()
                    break
                if user_input.lower() in ("exit", "quit"):
                    self.guardar_memoria_json()
                    if self.args.cost:
                        self._show_cost()
                    break
                if not user_input.strip():
                    continue

                augmented = user_input
                if self._use_rag():
                    ctx = self.memoria_semantica.retrieve(user_input, n_results=5)
                    if ctx:
                        ctx_str = self.memoria_semantica._format_context(ctx)
                        augmented = f"Contexto recuperado del proyecto:\n{ctx_str}\n\nPREGUNTA: {user_input}"

                self.historial.append({"role": "user", "content": augmented})
                assistant_content = self.ejecutar_peticion(self.historial)
                print(f"\n[AI]: {assistant_content}")

                # Solo guardar en Chroma Q&A limpio (sin el contexto RAG)
                if len(user_input) > 10 and len(assistant_content) > 20:
                    self.memoria_semantica.add_memory(
                        doc_id=str(uuid.uuid4()),
                        text=f"Q: {user_input} | A: {assistant_content}",
                        metadata={"source": "chat", "created_at": datetime.now(timezone.utc).isoformat()},
                    )

                self.historial.pop()
                self.historial.append({"role": "user", "content": user_input})
                self.historial.append({"role": "assistant", "content": assistant_content})
            except KeyboardInterrupt:
                self.guardar_memoria_json()
                break
            except OpenAIError as e:
                print(f"Error de API: {e}")

    def modo_single(self, prompt_text: str, cache_override: str | None = None) -> None:
        if self.args.cache_only:
            cached = self.cache.get(prompt_text, self._effective_model())
            if cached is not None:
                print(f"[cache] {cached}")
                return
            print("[cache] No cached response found.")
            return

        prompt_text_original = prompt_text
        memoria_resumen = self.cargar_contexto_json()

        augmented = prompt_text
        if self._use_rag():
            ctx = self.memoria_semantica.retrieve(prompt_text, n_results=8)
            if ctx:
                ctx_str = self.memoria_semantica._format_context(ctx)
                augmented = f"Contexto recuperado del proyecto:\n{ctx_str}\n\nPETICIÓN:\n{prompt_text}"

        messages: list[dict] = [{"role": "system", "content": f"{self.args.system}\n\nCONTEXTO GLOBAL: {memoria_resumen}"}]
        messages.append({"role": "user", "content": augmented})
        cache_key = cache_override or prompt_text_original
        res = self.ejecutar_peticion(messages, cache_key=cache_key)
        if res:
            print(res)

        if self.args.cost:
            self._show_cost()

        # Persistir en historial para que la próxima llamada recuerde
        self.historial.append({"role": "user", "content": prompt_text_original})
        self.historial.append({"role": "assistant", "content": res})
        self.guardar_memoria_json()

        # Almacenar en Chroma solo el Q&A limpio (sin contexto RAG)
        if len(prompt_text_original) > 20 and len(res) > 20:
            self.memoria_semantica.add_memory(
                doc_id=str(uuid.uuid4()),
                text=f"Q: {prompt_text_original[:500]} | A: {res[:500]}",
                metadata={"source": "single_shot", "created_at": datetime.now(timezone.utc).isoformat()},
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="AI Assistant - Optimized for cost & AI agent use")
    parser.add_argument("prompt", nargs="?", help="Pregunta directa")
    parser.add_argument("--chat", action="store_true", help="Modo chat interactivo")
    parser.add_argument("--system", "-s", help="System prompt", default="Eres un diseñador de juegos senior experto en Easy Hit, un Tactical Card RPG de combate simultáneo por turnos. Dominas las mecánicas del sistema de Clash (defensa absorbe daño primero), la regla de balance 7400, los 7 elementos (Fuego, Agua, Naturaleza, Rayo, Viento, Luz, Oscuridad) y las 5 clases (Robot, Dragón, Humano, Espectro, Neutral). Tu misión es ayudar a diseñar gameplay adictivo, dar consejos prácticos sobre estructura de juego por turnos, balance de cartas, experiencia de jugador, y buenas prácticas de código limpio en JavaScript/HTML/CSS. Usa el contexto recuperado del código fuente para dar respuestas precisas referenciando archivos y números de línea. Si no tienes suficiente contexto, indícalo claramente.")
    parser.add_argument("--model", "-m", default=DEFAULT_MODEL)
    parser.add_argument("--temperature", "-t", type=float, default=0.7)
    parser.add_argument("--max-tokens", type=int, default=2048)
    parser.add_argument("--file", "-f", help="Leer prompt desde archivo")
    parser.add_argument("--json", action="store_true", help="Output en JSON para parseo automático")
    parser.add_argument("--cost", action="store_true", help="Mostrar coste estimado al final")
    parser.add_argument("--minimal", action="store_true", help="Modo económico: gpt-4o-mini + sin RAG")
    parser.add_argument("--no-rag", action="store_true", help="Deshabilitar búsqueda en memoria semántica")
    parser.add_argument("--cache-only", action="store_true", help="Resolver solo desde caché, sin llamar API")
    parser.add_argument("--search", help="Buscar en ChromaDB sin llamar a la API (texto a buscar)")
    parser.add_argument("--index", help="Indexar archivo o directorio en ChromaDB")
    parser.add_argument("--index-all", action="store_true", help="Indexar TODO el proyecto Easy Hit")
    parser.add_argument("--index-pattern", default="*.js,*.html,*.css,*.md,*.json,*.py",
                        help="Patrón glob para --index en directorios")
    parser.add_argument("--reindex", action="store_true", help="Limpiar ChromaDB y re-indexar todo Easy Hit")

    args = parser.parse_args()
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # ── Auto-cargar .env si la API key no está en environment ──
    if not os.environ.get(API_KEY_ENV):
        project_root = Path(__file__).resolve().parent  # raíz del proyecto
        candidates = [
            Path.cwd() / ".env",
            project_root / ".env",
            project_root / ".env.example",
            Path.home() / ".ai_assistant" / ".env",
        ]
        for env_path in candidates:
            env_vars = load_env_file(env_path)
            if API_KEY_ENV in env_vars:
                os.environ[API_KEY_ENV] = env_vars[API_KEY_ENV]
                logger.info("API key loaded from %s", env_path)
                break

    try:
        app = EasyHitAssistant(args)

        # Modo search (solo ChromaDB, sin API)
        if args.search:
            results = app.memoria_semantica.search(args.search, n_results=10)
            if args.json:
                print(json.dumps(results, ensure_ascii=False, indent=2))
            else:
                for i, r in enumerate(results, 1):
                    src = r["metadata"].get("source", "?")
                    score = r.get("score", "?")
                    score_str = f" (s={score})" if score is not None else ""
                    print(f"{i}. [{src}]{score_str} {r['text'][:200]}")
            return

        # Modo index
        if args.index:
            p = resolve_project_path(args.index)
            if p.is_file():
                count = app.memoria_semantica.index_file(p)
                print(f"[OK] Indexado {count} chunks desde {p}")
            elif p.is_dir():
                count = app.memoria_semantica.index_directory(p, args.index_pattern)
                print(f"[OK] Indexados {count} chunks desde {p}")
            else:
                print(f"[ERROR] No encontrado: {args.index} (buscado en CWD y en directorio del proyecto)")
            return

        # Indexar todo el proyecto Easy Hit
        if args.index_all:
            project_dir = Path(__file__).resolve().parent
            if project_dir.exists():
                print(f"Indexando {project_dir} ...")
                count = app.memoria_semantica.index_directory(project_dir)
                print(f"[OK] Indexados {count} chunks del proyecto")
            else:
                print("[ERROR] No se encuentra el directorio del proyecto")
            return

        # Re-index: limpiar y re-indexar todo
        if args.reindex:
            print("[WAIT] Limpiando ChromaDB y re-indexando...")
            count = app.memoria_semantica.reindex_all()
            print(f"[OK] Re-indexados {count} chunks")
            return

        # Modos principales
        if args.chat:
            app.modo_chat()
        elif args.file:
            filepath = resolve_project_path(args.file)
            prompt = smart_read_text(filepath)
            app.modo_single(prompt)
        elif args.prompt:
            app.modo_single(args.prompt)
        else:
            stats = app.memoria_semantica.stats()
            print(f"Memoria: {stats['total_documents']} documentos en ChromaDB")
            print(f"Caché: {len(app.cache.data)} respuestas cacheadas")
            if stats['total_documents'] > 0 and not app.memoria_semantica.check_embedding_version():
                print(f"[!] Embedding model cambiado a '{EMBEDDING_MODEL}' — ejecuta --reindex para actualizar índices")
            print(f"Usa: {sys.argv[0]} --help para opciones")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
