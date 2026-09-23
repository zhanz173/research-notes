import fs from "node:fs/promises"
import YAML from "yaml"

const base = new URL(process.env.PAGES_BASE_URL)
if (!["https:", "http:"].includes(base.protocol)) throw new Error("Invalid Pages URL")
const file = "quartz.config.yaml"
const config = YAML.parse(await fs.readFile(file, "utf8"))
config.configuration.baseUrl = (base.host + base.pathname).replace(/\/+$/, "")
const index = config.plugins.find((plugin) => plugin.source === "@quartz-community/content-index")
Object.assign(index.options, { enableSiteMap: true, enableRSS: true })
await fs.writeFile(file, YAML.stringify(config))
console.log("Building for " + config.configuration.baseUrl)
