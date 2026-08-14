import { copyFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const distDir = join(process.cwd(), "dist")
const indexPath = join(distDir, "index.html")
const fallbackPath = join(distDir, "404.html")

if (!existsSync(indexPath)) {
  throw new Error("Cannot prepare GitHub Pages artifact because dist/index.html does not exist.")
}

copyFileSync(indexPath, fallbackPath)
console.log("Prepared GitHub Pages artifact: copied dist/index.html to dist/404.html")
