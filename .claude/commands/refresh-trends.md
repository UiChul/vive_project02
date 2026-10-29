---
description: GitHub/Reddit AI·IT 트렌드를 수집하고 summarizer 서브에이전트로 요약해 data/summary.json을 갱신한다
---

아래 파이프라인을 순서대로 실행해줘.

1. 프로젝트 루트에서 `npm run collect`를 실행해 `data/raw.json`을 만든다. 출력에서 성공/실패한 소스를 확인한다. 항목이 0개면 여기서 멈추고 이유를 알려준다.
2. `summarizer` 서브에이전트를 호출해 `data/raw.json` → `data/summary.json` 요약을 맡긴다. 요약은 직접 하지 말고 반드시 서브에이전트에게 맡긴다.
3. `data/summary.json`이 유효한 JSON이고 `items` 수가 raw와 같은지 확인한다 (`node -e "const r=require('./data/raw.json'),s=require('./data/summary.json');console.log(r.items.length,s.items.length)"`).
4. 결과를 짧게 보고한다: 수집 항목 수(소스별), 실패한 소스, highlights 3개. 화면은 `npm run dev` 후 http://localhost:3000 에서 볼 수 있다고 알려준다.
