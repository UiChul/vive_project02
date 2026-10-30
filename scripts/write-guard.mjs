// 요약 서브에이전트가 data/ 밖의 파일을 건드리지 않았는지 확인한다 (외부 글 속 프롬프트 인젝션 대비).
// 사용법: node scripts/write-guard.mjs snapshot  → 서브에이전트 호출 전에 data/ 밖 파일 상태를 기록
//         node scripts/write-guard.mjs check     → 기록 이후 바뀐·생긴·지워진 파일이 있으면 목록을 출력하고 exit 1
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["data", "node_modules", ".next", ".git"]); // 루트 바로 아래 폴더만
const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");
// 서브에이전트가 고쳐 쓰기 어렵도록 프로젝트 밖(OS 임시 폴더)에 기록한다.
const STATE = path.join(tmpdir(), `write-guard-${sha1(ROOT).slice(0, 12)}.json`);

async function hashTree(dir = ROOT, out = {}) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!(dir === ROOT && SKIP.has(entry.name))) await hashTree(full, out);
    } else if (entry.isFile()) {
      out[path.relative(ROOT, full).replaceAll("\\", "/")] = sha1(await readFile(full));
    }
  }
  return out;
}

const mode = process.argv[2];

if (mode === "snapshot") {
  const files = await hashTree();
  await writeFile(STATE, JSON.stringify(files));
  console.log(`✓ data/ 밖 파일 ${Object.keys(files).length}개 상태 기록`);
} else if (mode === "check") {
  const saved = await readFile(STATE, "utf8").catch(() => null);
  if (!saved) {
    console.error("✗ 기록된 상태가 없습니다. 서브에이전트 호출 전에 snapshot을 먼저 실행하세요.");
    process.exit(1);
  }
  const before = JSON.parse(saved);
  const after = await hashTree();
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((f) => before[f] !== after[f])
    .sort();
  if (changed.length > 0) {
    console.error(`✗ data/ 밖에서 바뀐 파일 ${changed.length}개:\n${changed.map((f) => `  ${f}`).join("\n")}`);
    process.exit(1);
  }
  console.log("✓ data/ 밖 변경 없음");
} else {
  console.error("사용법: node scripts/write-guard.mjs snapshot|check");
  process.exit(2);
}
