#!/usr/bin/env node
/**
 * PR 본문에 스크린샷을 자동으로 붙이는 스크립트.
 *
 *   npm run screenshots                 현재 브랜치의 PR에 스크린샷을 올리고 본문을 갱신
 *   npm run screenshots -- --local      업로드 없이 .screenshots/ 에만 저장 (확인용)
 *   npm run screenshots -- --pr 42      PR 번호를 직접 지정
 *   npm run screenshots -- --url http://localhost:5173
 *                                       이미 떠 있는 서버를 대상으로 촬영 (빌드 생략)
 *   npm run screenshots -- --scene home --scene validation-errors
 *                                       특정 장면만 촬영
 *   npm run screenshots -- --skip-build 기존 dist 를 그대로 사용
 *
 * 동작 방식
 *   1. 프로덕션 빌드 후 vite preview 로 서버를 띄운다.
 *   2. Playwright 로 아래 SCENES 를 순서대로 촬영한다.
 *   3. 이미지를 pr-screenshots 브랜치에 커밋한다. (소스 브랜치를 더럽히지 않기 위함)
 *   4. PR 본문의 마커 사이 구간을 스크린샷 섹션으로 교체한다.
 *
 * 필요 조건: gh CLI 로그인, devDependency 의 playwright
 */

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MARKER_START = "<!-- pr-screenshots:start -->";
const MARKER_END = "<!-- pr-screenshots:end -->";
const SCREENSHOT_BRANCH = "pr-screenshots";
const PREVIEW_PORT = 4173;

/**
 * 스크린샷을 안정적으로 찍기 위해 트랜지션/애니메이션을 끈다.
 * LogoCard 는 hover 시 3D 회전이 풀리면서 버튼 위치가 바뀌는데,
 * 이 때문에 클릭이 엉뚱한 요소에 맞는 문제도 함께 막아준다.
 */
const NO_MOTION_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }
`;

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

/**
 * hover 로 레이아웃이 바뀌는 요소가 있어, 먼저 올려두고 자리가 잡힌 뒤에 누른다.
 */
const clickStable = async (locator) => {
  await locator.hover();
  await locator.page().waitForTimeout(150);
  await locator.click();
};

/** 모달이 열릴 때까지 기다린다. (#card-form 은 Form 컴포넌트의 id) */
const openCardModal = async (page) => {
  await clickStable(page.getByRole("button", { name: /나만의 명함 만들기/ }));
  await page.locator("#card-form").waitFor({ state: "visible" });
};

/**
 * 촬영할 장면들. 새 화면이 생기면 여기에 추가하면 된다.
 *   name      파일명 및 --scene 으로 고르는 키
 *   title     PR 본문에 표시될 제목
 *   viewports VIEWPORTS 의 키 목록
 *   theme     "dark" 를 주면 다크 테마로 촬영
 *   fullPage  스크롤 전체를 담을지 여부 (모달처럼 fixed 요소는 false 가 낫다)
 *   action    스크린샷 직전에 수행할 조작
 */
const SCENES = [
  {
    name: "home",
    title: "홈",
    viewports: ["desktop", "mobile"],
    fullPage: true,
  },
  {
    name: "home-dark",
    title: "홈 (다크 테마)",
    viewports: ["desktop"],
    theme: "dark",
    fullPage: true,
  },
  {
    name: "new-card-modal",
    title: "명함 생성 모달",
    viewports: ["desktop", "mobile"],
    action: openCardModal,
  },
  {
    name: "validation-errors",
    title: "필수 항목 검증 에러",
    viewports: ["desktop"],
    action: async (page) => {
      await openCardModal(page);
      await clickStable(
        page.getByRole("button", { name: "명함 생성", exact: true })
      );
      await page.locator(".error-message").first().waitFor({ state: "visible" });
    },
  },
  {
    name: "custom-field",
    title: "추가 항목",
    viewports: ["desktop"],
    action: async (page) => {
      await openCardModal(page);
      await clickStable(page.getByRole("button", { name: /항목 추가/ }));
      const custom = page.locator(".form-group.custom").first();
      await custom.waitFor({ state: "visible" });
      await custom.scrollIntoViewIfNeeded();
    },
  },
  {
    name: "guide-tooltip",
    title: "안내 툴팁",
    viewports: ["desktop"],
    keepHover: true,
    action: async (page) => {
      await openCardModal(page);
      await page.getByRole("button", { name: "명함 생성 안내" }).hover();
      await page.waitForTimeout(200);
    },
  },
];

// ---------------------------------------------------------------- 인자 파싱

const parseArgs = (argv) => {
  const options = {
    local: false,
    skipBuild: false,
    pr: null,
    url: null,
    scenes: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} 에 값이 필요합니다.`);
      }
      i += 1;
      return value;
    };

    switch (arg) {
      case "--local":
      case "--no-upload":
        options.local = true;
        break;
      case "--skip-build":
        options.skipBuild = true;
        break;
      case "--pr":
        options.pr = next();
        break;
      case "--url":
        options.url = next();
        break;
      case "--scene":
        options.scenes.push(next());
        break;
      case "--help":
      case "-h":
        console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
        process.exit(0);
        break;
      default:
        throw new Error(`알 수 없는 옵션: ${arg}`);
    }
  }

  return options;
};

// ------------------------------------------------------------------ 유틸

const run = (command, args, input) =>
  execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    input,
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

const gh = (args, input) => run("gh", args, input);
const ghJson = (args, input) => JSON.parse(gh(args, input));

/** 실패가 정상 흐름인 조회에 쓴다. (gh 의 에러 출력을 그대로 흘리지 않는다) */
const ghQuiet = (args) =>
  execFileSync("gh", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

const log = (message) => console.log(`[screenshots] ${message}`);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const timestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
};

const waitForServer = async (url, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // 아직 뜨지 않았다.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`${url} 이(가) 준비되지 않았습니다.`);
};

// ------------------------------------------------------------------ 촬영

const capture = async (baseUrl, outDir, sceneFilter) => {
  const { chromium } = await import("playwright");

  const targets = sceneFilter.length
    ? SCENES.filter((scene) => sceneFilter.includes(scene.name))
    : SCENES;

  if (!targets.length) {
    throw new Error(`해당하는 장면이 없습니다: ${sceneFilter.join(", ")}`);
  }

  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const shots = [];

  try {
    for (const scene of targets) {
      for (const viewportName of scene.viewports) {
        const context = await browser.newContext({
          viewport: VIEWPORTS[viewportName],
          // 전체 페이지 샷은 2배 배율이면 파일이 지나치게 커진다.
          deviceScaleFactor: scene.fullPage ? 1 : 2,
          locale: "ko-KR",
          timezoneId: "Asia/Seoul",
          reducedMotion: "reduce",
        });

        // 테마는 localStorage 로 결정된다. (themeContext 의 qru_theme)
        await context.addInitScript(
          ([theme]) => window.localStorage.setItem("qru_theme", theme),
          [scene.theme ?? "light"]
        );

        const page = await context.newPage();

        try {
          await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
          await page.addStyleTag({ content: NO_MOTION_CSS });
          await page
            .getByRole("button", { name: /나만의 명함 만들기/ })
            .waitFor({ state: "visible" });

          if (scene.action) await scene.action(page);

          // 마우스를 치워 hover 상태가 스크린샷에 남지 않도록 한다.
          // 툴팁처럼 hover 가 있어야 보이는 장면은 keepHover 로 건너뛴다.
          if (!scene.keepHover) {
            const { width, height } = VIEWPORTS[viewportName];
            await page.mouse.move(width - 1, height - 1);
          }

          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(300);

          const fileName = `${scene.name}-${viewportName}.png`;
          const filePath = path.join(outDir, fileName);

          await page.screenshot({
            path: filePath,
            fullPage: Boolean(scene.fullPage),
            animations: "disabled",
          });

          shots.push({
            scene: scene.name,
            title: scene.title,
            viewport: viewportName,
            fileName,
            filePath,
          });
          log(`촬영 완료: ${fileName}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  return shots;
};

// ------------------------------------------------------------------ 업로드

/** 스크린샷 전용 브랜치가 없으면 빈 커밋으로 새로 만든다. */
const ensureScreenshotBranch = (repo) => {
  try {
    ghQuiet(["api", `repos/${repo}/git/ref/heads/${SCREENSHOT_BRANCH}`]);
    return;
  } catch {
    log(`${SCREENSHOT_BRANCH} 브랜치를 생성합니다.`);
  }

  const blob = ghJson(
    ["api", "-X", "POST", `repos/${repo}/git/blobs`, "--input", "-"],
    JSON.stringify({
      content: "PR 스크린샷 보관용 브랜치입니다. scripts/pr-screenshots.mjs 가 관리합니다.\n",
      encoding: "utf-8",
    })
  );

  const tree = ghJson(
    ["api", "-X", "POST", `repos/${repo}/git/trees`, "--input", "-"],
    JSON.stringify({
      tree: [{ path: "README.md", mode: "100644", type: "blob", sha: blob.sha }],
    })
  );

  const commit = ghJson(
    ["api", "-X", "POST", `repos/${repo}/git/commits`, "--input", "-"],
    JSON.stringify({ message: "chore: PR 스크린샷 브랜치 생성", tree: tree.sha })
  );

  ghJson(
    ["api", "-X", "POST", `repos/${repo}/git/refs`, "--input", "-"],
    JSON.stringify({ ref: `refs/heads/${SCREENSHOT_BRANCH}`, sha: commit.sha })
  );
};

/** 커밋 sha 로 고정된 raw URL 을 돌려준다. (나중에 덮어써도 링크가 깨지지 않는다) */
const uploadScreenshot = (repo, remotePath, localPath) => {
  const response = ghJson(
    ["api", "-X", "PUT", `repos/${repo}/contents/${remotePath}`, "--input", "-"],
    JSON.stringify({
      message: `chore: ${remotePath}`,
      content: readFileSync(localPath).toString("base64"),
      branch: SCREENSHOT_BRANCH,
    })
  );

  return `https://raw.githubusercontent.com/${repo}/${response.commit.sha}/${remotePath}`;
};

// -------------------------------------------------------------- PR 본문

const buildSection = (shots, meta) => {
  const bySceneName = new Map();

  for (const shot of shots) {
    if (!bySceneName.has(shot.scene)) bySceneName.set(shot.scene, []);
    bySceneName.get(shot.scene).push(shot);
  }

  const blocks = [...bySceneName.values()].map((sceneShots) => {
    const header = `### ${sceneShots[0].title}`;
    const columns = sceneShots.map((shot) => shot.viewport);
    const images = sceneShots.map(
      (shot) =>
        `<img src="${shot.url}" alt="${shot.title} (${shot.viewport})" width="${
          shot.viewport === "mobile" ? 240 : 460
        }">`
    );

    return [
      header,
      "",
      `| ${columns.join(" | ")} |`,
      `| ${columns.map(() => "---").join(" | ")} |`,
      `| ${images.join(" | ")} |`,
    ].join("\n");
  });

  return [
    MARKER_START,
    "## 스크린샷",
    "",
    `> \`npm run screenshots\` 로 자동 생성되었습니다. (${meta.capturedAt} · \`${meta.sha}\`)`,
    "",
    ...blocks.flatMap((block) => [block, ""]),
    MARKER_END,
  ].join("\n");
};

const updatePrBody = (prNumber, section) => {
  const pr = ghJson(["pr", "view", String(prNumber), "--json", "body,url"]);
  // GitHub 은 본문을 CRLF 로 돌려준다. 줄 단위 매칭을 위해 정규화한다.
  const current = (pr.body ?? "").replace(/\r\n/g, "\n");

  // 마커가 한 줄을 통째로 차지할 때만 교체한다.
  // 본문에서 마커를 인용해 설명하는 문장까지 삼키지 않기 위함.
  const pattern = new RegExp(
    `^${escapeRegExp(MARKER_START)}$[\\s\\S]*?^${escapeRegExp(MARKER_END)}$`,
    "m"
  );

  const next = pattern.test(current)
    ? current.replace(pattern, section)
    : `${current.trimEnd()}\n\n${section}\n`;

  const bodyFile = path.join(os.tmpdir(), `pr-body-${prNumber}-${Date.now()}.md`);
  writeFileSync(bodyFile, next);
  gh(["pr", "edit", String(prNumber), "--body-file", bodyFile]);

  return pr.url;
};

// -------------------------------------------------------------------- main

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  let repo = null;
  let prNumber = null;

  if (!options.local) {
    repo = ghJson(["repo", "view", "--json", "nameWithOwner"]).nameWithOwner;

    try {
      prNumber =
        options.pr ?? ghJson(["pr", "view", "--json", "number"]).number;
    } catch {
      throw new Error(
        "현재 브랜치에 연결된 PR을 찾지 못했습니다. --pr <번호> 로 지정하거나 --local 로 실행하세요."
      );
    }

    log(`대상: ${repo} #${prNumber}`);
  }

  let baseUrl = options.url;
  let server = null;

  if (!baseUrl) {
    if (!options.skipBuild) {
      log("프로덕션 빌드 중...");
      run("npm", ["run", "build"]);
    } else if (!existsSync(path.join(ROOT, "dist"))) {
      throw new Error("dist 가 없습니다. --skip-build 없이 실행하세요.");
    }

    baseUrl = `http://localhost:${PREVIEW_PORT}/`;
    log(`미리보기 서버 실행: ${baseUrl}`);

    server = spawn(
      "npx",
      ["vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort"],
      { cwd: ROOT, stdio: "ignore" }
    );

    await waitForServer(baseUrl);
  }

  const sha = run("git", ["rev-parse", "--short", "HEAD"]);
  const runId = `${timestamp()}-${sha}`;
  const outDir = path.join(ROOT, ".screenshots", runId);

  try {
    const shots = await capture(baseUrl, outDir, options.scenes);

    if (options.local) {
      log(`업로드를 건너뜁니다. 저장 위치: ${path.relative(ROOT, outDir)}`);
      return;
    }

    ensureScreenshotBranch(repo);

    for (const shot of shots) {
      shot.url = uploadScreenshot(
        repo,
        `pr-${prNumber}/${runId}/${shot.fileName}`,
        shot.filePath
      );
      log(`업로드 완료: ${shot.fileName}`);
    }

    const section = buildSection(shots, {
      sha,
      capturedAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    });

    const url = updatePrBody(prNumber, section);
    log(`PR 본문을 갱신했습니다: ${url}`);
  } finally {
    server?.kill();
  }
};

main().catch((error) => {
  console.error(`[screenshots] ${error.message}`);
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
});
