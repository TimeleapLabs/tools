import yaml from 'js-yaml'
import compose from '../assets/compose.yaml' with { type: 'file' }
import config from '../assets/default.yaml' with { type: 'file' }

type ComposeConfigEntry = string | { source: string }
type ComposeSecretEntry = string | { source: string }

type Service = {
  depends_on?: string[]
  configs?: ComposeConfigEntry[]
  secrets?: ComposeSecretEntry[]
  [key: string]: unknown
}

type Compose = {
  services: Record<string, Service>
  configs?: Record<string, unknown>
  secrets?: Record<string, unknown>
  networks?: Record<string, unknown>
}

type RawConfig = {
  network: {
    broker: {
      uri?: string
      publicKey: string
    }
  }
}

export const generateCompose = async (roles: string[], project: string) => {
  const file = Bun.file(compose)
  const doc = yaml.load(await file.text()) as Compose

  const selectedServices = Object.entries(doc.services || {}).reduce(
    (acc, [name, service]) => {
      if (!roles.includes(name)) return acc

      acc[name] = {
        ...service,
        ...(name === 'worker' && !roles.includes('broker')
          ? { depends_on: undefined }
          : {}),
      }

      return acc
    },
    {} as Record<string, Service>,
  )

  const usedConfigs = new Set<string>()
  const usedSecrets = new Set<string>()

  Object.values(selectedServices).forEach((svc) => {
    svc.configs?.forEach((c) => {
      if (typeof c === 'string') usedConfigs.add(c)
      else usedConfigs.add(c.source)
    })

    svc.secrets?.forEach((s) => {
      if (typeof s === 'string') usedSecrets.add(s)
      else usedSecrets.add(s.source)
    })
  })

  const filteredConfigs = Object.fromEntries(
    Object.entries(doc.configs || {}).filter(([name]) => usedConfigs.has(name)),
  )

  const filteredSecrets = Object.fromEntries(
    Object.entries(doc.secrets || {}).filter(([name]) => usedSecrets.has(name)),
  )

  const finalCompose = {
    services: selectedServices,
    networks: doc.networks,
    configs: Object.keys(filteredConfigs).length ? filteredConfigs : undefined,
    secrets: Object.keys(filteredSecrets).length ? filteredSecrets : undefined,
  }

  return Bun.write(`${project}/compose.yml`, yaml.dump(finalCompose))
}

export const generateConfig = async (
  path: string,
  broker?: { uri: string; key: string },
) => {
  const file = Bun.file(config)
  const doc = yaml.load(await file.text()) as RawConfig

  if (broker) {
    doc.network.broker.publicKey = broker.key
    doc.network.broker.uri = broker.uri
  } else {
    const keyFile = Bun.file(`${path}/secrets/broker_secrets.yaml`)
    const parsedKey = yaml.load(await keyFile.text()) as { publicKey: string }

    doc.network.broker.publicKey = parsedKey.publicKey
  }

  return Bun.write(`${path}/config.yaml`, yaml.dump(doc))
}
