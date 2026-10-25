import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORDS_FILE = new URL("./spinners.txt", import.meta.url);
const FALLBACK_WORD = "Working";
/** Claude Code's VS Code extension rotates verbs on a hardcoded random schedule. */
const DELAYS_MS = [2000, 3000, 5000];
const SETTINGS_KEY = "piSpinners";

export function parseWords(text: string): string[] {
  const words = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return words.length > 0 ? words : [FALLBACK_WORD];
}

function loadWords(): string[] {
  try {
    return parseWords(readFileSync(WORDS_FILE, "utf8"));
  } catch {
    return [FALLBACK_WORD];
  }
}

function settingsPath(): string {
  const dir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
  return join(dir, "settings.json");
}

function readEnabled(): boolean {
  try {
    const section = JSON.parse(readFileSync(settingsPath(), "utf8"))[SETTINGS_KEY] as
      | { enabled?: unknown }
      | undefined;
    return section?.enabled !== false;
  } catch {
    return true;
  }
}

function writeEnabled(enabled: boolean): void {
  const path = settingsPath();
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    // No settings file yet: start from an empty object.
  }
  settings[SETTINGS_KEY] = { enabled };
  writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
}

export default function (pi: ExtensionAPI) {
  let words = [FALLBACK_WORD];
  let enabled = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ui: ExtensionContext["ui"] | undefined;

  const pick = () => words[Math.floor(Math.random() * words.length)] ?? FALLBACK_WORD;
  const pickDelay = () => DELAYS_MS[Math.floor(Math.random() * DELAYS_MS.length)] ?? DELAYS_MS[0]!;

  function stop(): void {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function rotate(): void {
    ui?.setWorkingMessage(`${pick()}…`);
    timer = setTimeout(rotate, pickDelay());
    timer.unref?.();
  }

  function start(): void {
    stop();
    rotate();
  }

  pi.on("session_start", (_event, ctx) => {
    ui = ctx.ui;
    words = loadWords();
    enabled = readEnabled();
    if (enabled) ctx.ui.setWorkingMessage(`${pick()}…`);
  });

  pi.on("agent_start", (_event, ctx) => {
    ui = ctx.ui;
    if (enabled) start();
  });

  pi.on("agent_settled", () => stop());
  pi.on("session_shutdown", () => stop());

  pi.registerCommand("spinners", {
    description: "Toggle rotating spinner verbs; the choice is saved in settings.json",
    handler: async (args, ctx) => {
      const arg = args.trim().toLowerCase();
      if (arg !== "on" && arg !== "off") {
        ctx.ui.notify(`Spinner verbs are ${enabled ? "on" : "off"}. Use /spinners on|off.`, "info");
        return;
      }
      enabled = arg === "on";
      writeEnabled(enabled);
      if (enabled) {
        words = loadWords();
        ui = ctx.ui;
        start();
      } else {
        stop();
        ctx.ui.setWorkingMessage(undefined);
      }
      ctx.ui.notify(`Spinner verbs ${enabled ? "on" : "off"}`, "info");
    },
  });
}
