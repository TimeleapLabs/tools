import { Command } from "commander";
import { spawn } from "bun";
import path from "path";
import process from "process";

const program = new Command();

Bun.embeddedFiles.forEach((item) => console.log(item.name));

const fail = (msg: string, err: any) => {
  const out =
    err?.message ||
    (typeof err === "string" ? err : JSON.stringify(err, null, 2));
  console.error(`\n❌ ${msg}\n\n${out}\n`);
  process.exit(1);
};

const run = async (args: string[]) => {
  const proc = spawn(["docker", "compose", ...args], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      TERM: "xterm",
    },
  });

  const stderrOutput = proc.stderr ? await proc.stderr.text() : null;
  const exitCode = await proc.exited;

  if (exitCode !== 0 && exitCode !== 130) {
    throw new Error(stderrOutput || `Process exited with code ${exitCode}`);
  }
};

program.name("tlp").description("Timeleap CLI wrapper").version("0.1.0");

program
  .command("init")
  .description("Interactive node setup wizard")
  .action(async () => {
    await import("./libs/init-wizard");
  });

program
  .command("broker")
  .description("Start broker node")
  .option("-f, --file <path>", "Path to Docker Compose file", "compose.yml")
  .option("-d, --detached", "Run containers in background")
  .action(async ({ file, detached }) => {
    const resolved = path.resolve(process.cwd(), file);
    const args = ["-f", resolved, "up", "broker"];
    if (detached) args.push("-d");
    try {
      await run(args);
    } catch (err) {
      fail("Failed to start broker", err);
    }
  });

program
  .command("worker")
  .description("Start worker node")
  .option("-f, --file <path>", "Path to Docker Compose file", "compose.yml")
  .option("-d, --detached", "Run containers in background")
  .action(async ({ file, detached }) => {
    const resolved = path.resolve(process.cwd(), file);
    const args = ["-f", resolved, "up", "worker"];
    if (detached) args.push("-d");
    try {
      await run(args);
    } catch (err) {
      fail("Failed to start worker", err);
    }
  });

program
  .command("compose [args...]")
  .description("Run docker compose commands (passthrough)")
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const hasFile = args.includes("-f") || args.includes("--file");
    const defaultFile = path.resolve(process.cwd(), "compose.yml");
    const finalArgs = hasFile ? args : ["-f", defaultFile, ...args];

    try {
      await run(finalArgs);
    } catch (err) {
      fail("Docker Compose command failed", err);
    }
  });

program
  .command("plugin")
  .description("Register plugin with broker")
  .action(() => {
    console.log("🔧 Plugin registration not implemented yet.");
  });

await program.parseAsync();
