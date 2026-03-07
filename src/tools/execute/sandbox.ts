/** Docker-based sandboxed code execution.
 *
 * Each execution spawns a new Docker container with:
 * - Resource limits (memory, CPU time)
 * - No network by default (configurable)
 * - Read-only filesystem
 * - Non-root user
 * - Auto-removal on exit
 */

import { spawn } from "child_process";
import { languages, type SupportedLanguage } from "./languages";

export interface ExecuteRequest {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
  allowNetwork?: boolean;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

export async function execute(req: ExecuteRequest): Promise<ExecuteResult> {
  const lang = languages[req.language];
  if (!lang) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${req.language}`,
      exitCode: 1,
      durationMs: 0,
      timedOut: false,
    };
  }

  const timeout = Math.min(req.timeoutMs ?? lang.defaultTimeout, lang.maxTimeout);

  // Build docker run command
  const args: string[] = [
    "run",
    "--rm",                              // auto-remove container
    "--read-only",                       // read-only filesystem
    "--tmpfs", "/tmp:rw,noexec,size=64m", // writable /tmp for temp files
    "--memory", lang.memoryLimit,         // memory limit
    "--cpus", "1",                        // 1 CPU max
    "--pids-limit", "64",                 // prevent fork bombs
    "--user", "nobody",                   // non-root
  ];

  // Network isolation
  if (!req.allowNetwork) {
    args.push("--network", "none");
  }

  // Stdin piping
  if (req.stdin) {
    args.push("-i");
  }

  // Image and command
  args.push(lang.image, ...lang.command(req.code));

  const start = performance.now();

  return new Promise<ExecuteResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const proc = spawn("docker", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Capture output (capped at 1MB each)
    const MAX_OUTPUT = 1024 * 1024;

    proc.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT) {
        stdout += chunk.toString().slice(0, MAX_OUTPUT - stdout.length);
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT) {
        stderr += chunk.toString().slice(0, MAX_OUTPUT - stderr.length);
      }
    });

    // Send stdin if provided
    if (req.stdin) {
      proc.stdin.write(req.stdin);
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }

    // Timeout handler
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeout);

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      const durationMs = Math.round(performance.now() - start);

      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: code ?? 1,
        durationMs,
        timedOut,
      });
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      resolve({
        stdout: "",
        stderr: `Sandbox error: ${err.message}`,
        exitCode: 1,
        durationMs: Math.round(performance.now() - start),
        timedOut: false,
      });
    });
  });
}
