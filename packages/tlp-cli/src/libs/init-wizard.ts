import { $, spawnSync } from 'bun'
import { readdirSync, statSync } from 'fs'
import path from 'path'
import {
  cancel,
  group,
  intro,
  multiselect,
  note,
  outro,
  text,
} from '@clack/prompts'
import { generateCompose, generateConfig } from './parser'
import colors from 'picocolors'

export const isNonEmptyDirectory = (path: string): boolean => {
  try {
    const stats = statSync(path)
    if (!stats.isDirectory()) return false

    return readdirSync(path).length > 0
  } catch {
    return false
  }
}

export default async () => {
  console.log()
  intro(colors.bgCyan(colors.black(' Timeleap Wizard ')))

  const project = await group(
    {
      path: () =>
        text({
          message: 'Where should we init your nodes?',
          placeholder: './timeleap',
          validate: (value) => {
            if (!value) return 'Please enter a path.'
            if (value[0] !== '.') return 'Please enter a relative path.'
            if (isNonEmptyDirectory(value))
              return 'Target directory exists and is not empty'

            return undefined
          },
        }),
      role: () =>
        multiselect({
          message: "Select the roles you'd like to install",
          initialValues: ['worker'],
          options: [{ value: 'worker' }, { value: 'broker' }],
        }),
    },
    {
      onCancel: () => {
        cancel('Installation canceled')
        process.exit(0)
      },
    },
  )

  const absPath = path.resolve(process.cwd(), project.path)

  const secretsPath = path.join(absPath, 'secrets')

  const generateSecrets = async () => {
    const isLinux = process.platform === 'linux'

    const uid = isLinux ? process.env.UID || (await $`id -u`.text()).trim() : ''

    await $`mkdir -p ${secretsPath}`

    for (const role of project.role) {
      await $`touch ${secretsPath}/${role}_secrets.yaml`
      const { exitCode, stderr } = spawnSync({
        cmd: [
          'docker',
          'run',
          '-v',
          `${secretsPath}:/secrets`,
          '--rm',
          ...(isLinux ? ['--user', `${uid}:${uid}`] : []),
          'ghcr.io/timeleaplabs/timeleap',
          'generate-secrets',
          '-s',
          `/secrets/${role}_secrets.yaml`,
        ],
      })
      if (exitCode !== 0) {
        cancel('Generating secrets failed')
        console.log(String(stderr))
        process.exit(1)
      }
    }
  }

  await generateSecrets()
  await generateCompose(project.role, absPath)

  if (!project.role.includes('broker')) {
    const broker = await group(
      {
        uri: () =>
          text({
            message: 'Please provide your broker uri',
            placeholder: 'ws://timeleap.swiss',
            validate: (value) => {
              if (!value) return 'uri is required'
              if (!value.startsWith('ws://'))
                return 'Only websocket URIs are valid'
              return undefined
            },
          }),
        key: () =>
          text({
            message: 'Please provide your broker public key',
            validate: (value) => {
              if (!value) return 'Please enter a public key'
              return undefined
            },
          }),
      },
      {
        onCancel: () => {
          cancel('Canceled by user')
          process.exit(0)
        },
      },
    )
    const { uri, key } = broker
    await generateConfig(absPath, { uri, key })
  } else {
    await generateConfig(absPath)
  }

  note(
    [
      `${colors.dim('cd')} ${colors.blueBright(project.path)}`,
      `${colors.dim('tlp')} ${colors.blueBright('compose up')}`,
    ].join('\n'),
    colors.cyan('Next steps'),
  )

  outro('You are ready to use Timeleap!')
}
