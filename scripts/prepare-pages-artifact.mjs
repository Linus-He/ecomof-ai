import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const distDir = join(process.cwd(), "dist")
const indexPath = join(distDir, "index.html")
const fallbackPath = join(distDir, "404.html")

if (!existsSync(indexPath)) {
  throw new Error("Cannot prepare GitHub Pages artifact because dist/index.html does not exist.")
}

const leakedFiles = []
const inspectDir = (directory) => {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry)
    if (statSync(filePath).isDirectory()) {
      inspectDir(filePath)
      continue
    }

    if (filePath.endsWith(".map")) {
      leakedFiles.push(filePath)
      continue
    }

    const content = readFileSync(filePath, "utf8")
    if (content.includes("sourcesContent") || /\/src\/main\.(tsx|ts|jsx|js)/.test(content)) {
      leakedFiles.push(filePath)
    }
  }
}

inspectDir(distDir)

if (leakedFiles.length > 0) {
  throw new Error(
    `Refusing to prepare GitHub Pages artifact: source metadata found in ${leakedFiles.join(", ")}.`,
  )
}

copyFileSync(indexPath, fallbackPath)
console.log("Prepared GitHub Pages artifact: copied dist/index.html to dist/404.html")
