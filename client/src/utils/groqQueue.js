// 전역 Groq 직렬화 큐 — Home.jsx와 ChatBot.jsx가 공유
// 모든 Groq 호출을 하나의 큐로 순서화해 429 방지
let _queue = Promise.resolve();
let _lastCall = 0;

// 추천(배치): 4초 간격 — free tier TPM 여유 확보
// 챗봇(인터랙티브): 1초 간격 — 사용자 대기시간 최소화
export function enqueueGroq(fn, gapMs = 4000) {
  const job = _queue.then(async () => {
    const gap = gapMs - (Date.now() - _lastCall);
    if (gap > 0) await new Promise(r => setTimeout(r, gap));
    _lastCall = Date.now();
    return fn();
  });
  _queue = job.then(() => undefined, () => undefined);
  return job;
}

// 추천용: 4초 간격 + 429 시 35초 대기 후 재시도
export async function groqFetch(body) {
  const doFetch = () => enqueueGroq(() =>
    fetch("/api/groq/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }), 4000
  );

  let res = await doFetch();
  if (res.status === 429) {
    const retryAfterSec = parseInt(res.headers.get("retry-after") || "35");
    await new Promise(r => setTimeout(r, retryAfterSec * 1000));
    res = await doFetch();
  }
  return res;
}

// 챗봇용: 1초 간격 + 429 시 재시도 없이 즉시 반환 (UI에서 처리)
export async function groqFetchChat(body) {
  return enqueueGroq(() =>
    fetch("/api/groq/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }), 1000
  );
}
