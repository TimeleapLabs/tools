import { $, spawnSync, sleep } from "bun";
import path from "path";
import {
  cancel,
  confirm,
  group,
  intro,
  multiselect,
  note,
  outro,
  text,
} from "@clack/prompts";
import { generateCompose, generateConfig } from "./parser";
import colors from "picocolors";

export default async () => {
  intro(colors.bgCyan(colors.black(" Timeleap Wizard ")));

  const project = await group(
    {
      path: () =>
        text({
          message: "Where should we init your nodes?",
          placeholder: "./timeleap",
          validate: (value) => {
            if (!value) return "Please enter a path.";
            if (value[0] !== ".") return "Please enter a relative path.";
            return undefined;
          },
        }),
      role: () =>
        multiselect({
          message: "Select the roles you'd like to install",
          initialValues: ["worker"],
          options: [{ value: "worker" }, { value: "broker" }],
        }),
    },
    {
      onCancel: () => {
        cancel("Installation canceled");
        process.exit(0);
      },
    },
  );

  const absPath = path.resolve(process.cwd(), project.path);
  const secretsPath = path.join(absPath, "secrets");

  const generateSecrets = async () => {
    const isLinux = process.platform === "linux";

    const uid = isLinux
      ? process.env.UID || (await $`id -u`.text()).trim()
      : "";
    const gid = isLinux
      ? process.env.GID || (await $`id -g`.text()).trim()
      : "";

    for (const role of project.role) {
      const { exitCode } = spawnSync({
        cmd: [
          "docker",
          "run",
          "-v",
          `${secretsPath}:/secrets`,
          "--rm",
          ...(isLinux ? ["--user", `${uid}:${gid}`] : []),
          "ghcr.io/timeleaplabs/timeleap",
          "generate-secrets",
          "-s",
          `/secrets/${role}_secrets.yaml`,
        ],
      });
      if (exitCode !== 0) {
        cancel("Generating secrets failed");
        process.exit(0);
      }
    }
  };

  await $`mkdir -p ${secretsPath}`;
  await generateSecrets();
  await generateCompose(project.role, absPath);

  if (!project.role.includes("broker")) {
    const broker = await group(
      {
        uri: () =>
          text({
            message: "Please provide your broker uri",
            placeholder: "ws://timeleap.swiss",
            validate: (value) => {
              if (!value) return "uri is required";
              if (!value.startsWith("ws://"))
                return "Only websocket URIs are valid";
              return undefined;
            },
          }),
        key: () =>
          text({
            message: "Please provide your broker public key",
            validate: (value) => {
              if (!value) return "Please enter a public key";
              return undefined;
            },
          }),
      },
      {
        onCancel: () => {
          cancel("Canceled by user");
          process.exit(0);
        },
      },
    );
    const { uri, key } = broker;
    await generateConfig(absPath, { uri, key });
  } else {
    await generateConfig(absPath);
  }

  note(`cd ${project.path} \ntlp compose up`, "Next steps");

  outro("You are ready to use Timeleap!");
};
