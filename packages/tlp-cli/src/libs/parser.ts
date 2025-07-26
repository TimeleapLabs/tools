import yaml from "js-yaml";
import compose from "../assets/compose.yaml" with { type: "text" };
import config from "../assets/default.yaml" with { type: "text" };

type Compose = {
  services: Record<string, any>;
  configs?: Record<string, any>;
  secrets?: Record<string, any>;
  networks?: Record<string, any>;
};

export const generateCompose = async (roles: string[], project: string) => {
  const doc = yaml.load(compose) as Compose;

  const selectedServices = Object.entries(doc.services || {})
    .filter(([name]) => roles.includes(name))
    .reduce(
      (acc, [name, service]) => {
        acc[name] = {
          ...service,
          ...(name === "worker" && !roles.includes("broker")
            ? { depends_on: undefined }
            : {}),
        };
        return acc;
      },
      {} as Record<string, any>,
    );

  // Filter only used configs/secrets
  const usedConfigs = new Set<string>();
  const usedSecrets = new Set<string>();

  Object.values(selectedServices).forEach((svc) => {
    (svc.configs || []).forEach((c: any) => {
      if (typeof c === "string") usedConfigs.add(c);
      else if (c?.source) usedConfigs.add(c.source);
    });
    (svc.secrets || []).forEach((s: any) => {
      if (typeof s === "string") usedSecrets.add(s);
      else if (s?.source) usedSecrets.add(s.source);
    });
  });

  const filteredConfigs = Object.fromEntries(
    Object.entries(doc.configs || {}).filter(([name]) => usedConfigs.has(name)),
  );

  const filteredSecrets = Object.fromEntries(
    Object.entries(doc.secrets || {}).filter(([name]) => usedSecrets.has(name)),
  );

  const finalCompose = {
    services: selectedServices,
    networks: doc.networks,
    configs: Object.keys(filteredConfigs).length ? filteredConfigs : undefined,
    secrets: Object.keys(filteredSecrets).length ? filteredSecrets : undefined,
  };

  return Bun.write(`${project}/compose.yml`, yaml.dump(finalCompose));
};
export const generateConfig = async (
  path: string,
  broker?: { uri: string; key: string },
) => {
  const doc = yaml.load(config);

  if (broker) {
    doc.network.broker.publicKey = broker.key;
    doc.network.broker.uri = broker.uri;
  } else {
    // console.log(`${path}/secrets/broker_secrets.yaml`);
    const key = Bun.file(`${path}/secrets/broker_secrets.yaml`);
    const parsedKey = yaml.load(await key.text());

    doc.network.broker.publicKey = parsedKey.publicKey;
  }

  return Bun.write(`${path}/config.yaml`, yaml.dump(doc));
};
