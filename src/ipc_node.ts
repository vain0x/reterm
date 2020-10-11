import { ipcMain } from "electron"
import * as fs from "fs"
import * as path from "path"

export const exposeNodeApi = () => {
  ipcMain.handle("node-fs-readdir", (_ev, path: string) => fs.promises.readdir(path))

  ipcMain.handle("node-fs-stat", async (_ev, path: string) => {
    const stats = await fs.promises.stat(path)
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    }
  })

  ipcMain.handle("node-path-basename", (_ev, filepath: string) => path.basename(filepath))
}
