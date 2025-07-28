import { $ } from 'bun'

const targets = [
  { name: 'linux-x64-baseline', out: 'tlp-linux-x64.zip' },
  { name: 'darwin-arm64', out: 'tlp-darwin-aarch64.zip' },
  { name: 'darwin-x64', out: 'tlp-darwin-x64.zip' },
]

for (const { name, out } of targets) {
  const outdir = `dist/tlp-${name}`
  const outfile = `${outdir}/tlp`

  console.log(`📦 Building for ${name}...`)
  await $`rm -rf ${outdir}`
  await $`bun build --compile --target=bun-${name} src/index.ts --outfile ${outfile}`
  await $`chmod +x ${outfile}`

  console.log(`📦 Zipping ${out}...`)
  await $`zip -j dist/${out} ${outfile}`
}
