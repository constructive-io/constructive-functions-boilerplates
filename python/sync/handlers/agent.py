"""The invocation context: who a call is for, and the platform it can reach.

The worker POSTs to the image and signs the request with the invocation's
identity — `X-Database-Id` and friends. It hands over no database handle and no
client object, so this is where those headers become one typed thing, read once,
here, instead of in every function.

    def ____method____(params, agent):
        vectors = agent.embed(params["text"])            # the tenant's own model
        answer = agent.inference([{"role": "user", "content": "hi"}])

`embed` and `inference` go to the agentic server, which resolves the provider,
the model and the key **per tenant** from the identity headers — so a function
never reads a model credential itself. Standard library only: an image is a URL,
and the template has no build step to install a client into.
"""

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Optional

# The identity the platform signs an invocation with. `X-Database-Id` is the
# tenant; everything else narrows who inside it, or which job this is.
IDENTITY = {
    "database_id": "X-Database-Id",
    "entity_id": "X-Entity-Id",
    "actor_id": "X-Actor-Id",
    "organization_id": "X-Organization-Id",
    "scope": "X-Scope",
    "worker_id": "X-Worker-Id",
    "job_id": "X-Job-Id",
    "invocation_id": "X-Invocation-Id",
}


@dataclass(frozen=True)
class AgentContext:
    """The invocation's identity, and the agentic server reached as that identity."""

    database_id: str
    entity_id: Optional[str] = None
    actor_id: Optional[str] = None
    organization_id: Optional[str] = None
    scope: Optional[str] = None
    worker_id: Optional[str] = None
    job_id: Optional[str] = None
    invocation_id: Optional[str] = None
    timeout_seconds: float = 120.0

    @classmethod
    def from_headers(cls, headers) -> "AgentContext":
        """Read the identity off a request. Anything unsigned fails loud: a call
        without a database is a call to the wrong tenant, not a call to none."""
        read = {
            field: (headers.get(header) or headers.get(header.lower()))
            for field, header in IDENTITY.items()
        }
        if not read["database_id"]:
            raise RuntimeError(
                "the invocation carries no X-Database-Id — it was not signed by the platform"
            )
        return cls(**read)

    def embed(self, text, model: Optional[str] = None) -> list:
        """Embed one string or a list of them. Returns a vector per input."""
        body = {"input": text}
        if model is not None:
            body["model"] = model
        data = self._post("/v1/embeddings", body)
        vectors = [item["embedding"] for item in data.get("data", [])]
        if not vectors or not all(vectors):
            raise RuntimeError(f"the agentic server returned no embedding for {model or 'the default model'}")
        return vectors

    def inference(
        self,
        messages: list,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        """Chat completion. Returns `{content, finish_reason, usage}`."""
        body = {"messages": messages}
        for name, value in (
            ("model", model),
            ("temperature", temperature),
            ("max_tokens", max_tokens),
        ):
            if value is not None:
                body[name] = value
        data = self._post("/v1/chat/completions", body)
        choice = (data.get("choices") or [{}])[0]
        return {
            "content": choice.get("message", {}).get("content", ""),
            "finish_reason": choice.get("finish_reason", "stop"),
            "usage": data.get("usage", {}),
        }

    def headers(self) -> dict:
        """The identity, as headers — for a platform service called directly."""
        return {IDENTITY[field]: value for field, value in vars(self).items()
                if field in IDENTITY and value}

    def _post(self, path: str, body: dict) -> dict:
        url = os.environ.get("AGENTIC_SERVER_URL")
        if not url:
            raise RuntimeError(
                "AGENTIC_SERVER_URL is not set: this image cannot reach the agentic server"
            )
        request = urllib.request.Request(
            url.rstrip("/") + path,
            data=json.dumps(body).encode(),
            headers={"content-type": "application/json", **self.headers()},
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as err:
            # The status alone is unreadable in a job log; the body says which
            # model or which tenant configuration was rejected.
            raise RuntimeError(
                f"agentic server {err.code} on {path}: {err.read().decode('utf-8', 'replace')}"
            ) from err
