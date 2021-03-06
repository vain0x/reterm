import { app, BrowserWindow, ipcMain } from "electron"
import * as path from "path"
import { JobStatus, Running, Exited, ExitedOk } from "./shared/job_status"
import * as pty from "node-pty"

type JobId = string

interface JobState {
  id: JobId
  cmdline: string
  proc: pty.IPty | null
  status: JobStatus
}

let lastJobId = 0
let workDir = process.cwd()
const jobs: JobState[] = []

const doExecute = (cmdline: string, reply: (...args: unknown[]) => void): JobState => {
  lastJobId++
  const jobId = lastJobId.toString()

  console.log("[TRACE] execute", jobId, cmdline)
  const [cmd, ...args] = cmdline.trim().split(" ")

  // 組み込みコマンド
  switch (cmd) {
    case "cd": {
      const [dir] = args

      console.log("[TRACE] cd", dir)
      workDir = dir
      return { id: jobId, cmdline, proc: null, status: ExitedOk }
    }
    case "pwd": {
      console.log("[TRACE] pwd", workDir)
      return { id: jobId, cmdline, proc: null, status: ExitedOk }
    }
    default:
      break
  }

  // 外部コマンド
  const proc = pty.spawn(cmd, args, {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: workDir,
    env: process.env as Record<string, string>,
  })

  const job: JobState = {
    id: jobId,
    cmdline,
    proc,
    status: Running,
  }

  proc.onData(data => {
    console.log("[TRACE] process data", jobId, data.length)
    reply("rt-job-data", jobId, data)
  })

  proc.onExit(({ exitCode, signal }) => {
    console.log("[TRACE] process exit", jobId, exitCode, signal)
    job.status = Exited(exitCode)
    reply("rt-job-exit", jobId, exitCode, signal)
  })
  return job
}

ipcMain.handle("rt-get-work-dir", () => {
  console.log("[TRACE] rt-get-work-dir")
  return workDir
})

ipcMain.on("rt-execute", (ev, cmdline) => {
  const reply = ev.reply.bind(ev)
  const job = doExecute(cmdline, reply)

  jobs.push(job)

  ev.reply("rt-job-created", job.id, job.cmdline, job.status)
})

ipcMain.handle("rt-kill", (_ev, jobId, signal) => {
  console.log("[TRACE] rt-kill", jobId, signal)

  const job = jobs.find(j => j.id === jobId)
  if (job == null || job.status.kind === "EXITED" || job.proc == null) {
    console.log("[WARN]     job missing, exited or built-in", job?.status?.kind)
    return null
  }

  job.proc.kill(signal)
  return true
})

ipcMain.handle("rt-write", (_ev, jobId, data) => {
  console.log("[TRACE] rt-write", jobId, data)

  const job = jobs.find(j => j.id === jobId)
  if (job == null || job.status.kind === "EXITED" || job.proc == null) {
    console.log("[WARN]     job missing, exited or built-in?", job?.status)
    return null
  }

  job.proc.write(data)
  return true
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow()

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
