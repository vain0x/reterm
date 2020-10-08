import { ipcRenderer } from "electron"
import React from "react"
import { JobStatus, Exited, ExitedOk, ExitedErr } from "./shared/job_status"

type JobId = string

interface JobState {
  jobId: JobId
  cmdline: string
  status: JobStatus
  output: string
}

const Job: React.FC<JobState> = ({ jobId, cmdline, status, output }) => {
  const [inputText, setInputText] = React.useState("hey")
  const [autoEol, setAutoEol] = React.useState(true)

  return (
    <li
      key={jobId}
      className="g-job"
      data-status={status.kind === "EXITED" ? (status.exitCode === 0 ? "ok" : "error") : "running"}>
      <details>
        <summary>
          <code>$ {cmdline}</code>
          <code color="#666">#{jobId}</code>
        </summary>

        <pre style={{ background: "#eee" }}>{output}</pre>

        <textarea
          value={inputText}
          onChange={ev => setInputText(ev.target.value)}
          onKeyPress={ev => {
            if (ctrlEnterIsPressed(ev) && inputText !== "") {
              const text = autoEol && !inputText.endsWith("\n") ? inputText + "\n" : inputText
              ipcRenderer.invoke("rt-write", jobId, text)
              setInputText("")
            }
          }} />

        <label>
          <input type="checkbox" checked={autoEol} onChange={() => setAutoEol(!autoEol)} />
          自動改行
        </label>
      </details>
    </li>
  )
}

export const Main: React.FC = () => {
  // 作業ディレクトリ
  const [workDir, setWorkDir] = React.useState("...")

  // 起動時に作業ディレクトリを受け取る。
  React.useEffect(() => {
    console.log("[TRACE] get-work-dir BEGIN")
    ipcRenderer.invoke("rt-get-work-dir").then(workDir => {
      console.log("[TRACE] get-work-dir OK", workDir)
      setWorkDir(workDir)
    }).catch(err => console.error(err))
  }, [])

  // ジョブリスト

  const [jobs, setJobs] = React.useState<JobState[]>([
    // ダミーデータ
    {
      jobId: "-2",
      cmdline: "echo 'Hello, world!'",
      output: "Hello, world!",
      status: ExitedOk,
    },
    {
      jobId: "-1",
      cmdline: "pwd",
      output: "/path/to/work-dir",
      status: ExitedErr,
    },
  ])

  // ジョブの出力を追記する。
  React.useEffect(() => {
    ipcRenderer.on("rt-job-created", (_ev, jobId: JobId, cmdline: string, status) => {
      console.log("[TRACE] rt-job-created", jobId)

      setJobs(jobs => [
        ...jobs,
        {
          jobId,
          cmdline,
          output: "",
          status,
        },
      ])
    })

    ipcRenderer.on("rt-job-data", (_ev, jobId: JobId, data: string) => {
      console.log("[TRACE] rt-job-data", jobId, data.length)

      setJobs(jobs => jobs.map(job => {
        if (job.jobId !== jobId) {
          return job
        }

        const output = job.output !== "" ? job.output + "\n" + data : data
        return { ...job, output }
      }))
    })

    ipcRenderer.on("rt-job-exit", (_ev, jobId: JobId, exitCode: number, signal: unknown) => {
      console.log("[TRACE] rt-job-exit", jobId, exitCode, signal)

      setJobs(jobs => jobs.map(job => {
        if (job.jobId !== jobId) {
          return job
        }

        return { ...job, status: Exited(exitCode) }
      }))
    })
  }, [])

  // コマンドライン
  const [cmdline, setCmdline] = React.useState("pwd")

  const trimmedCmdline = cmdline.trim()
  const execute = React.useMemo(() => async () => {
    if (trimmedCmdline === "") {
      console.log("[TRACE] can't execute empty string")
      return
    }

    // const channel = new MessageChannel()

    console.log("[TRACE] execute", trimmedCmdline)
    ipcRenderer.send("rt-execute", trimmedCmdline)
  }, [trimmedCmdline, jobs])

  return (
    <main id="app-main">
      <ul id="job-list">
        {jobs.map(job => (
          <Job key={job.jobId} {...job} />
        ))}
      </ul>

      <div>
        <code>$ {workDir}</code>
      </div>

      <textarea
        value={cmdline}
        onChange={ev => setCmdline(ev.target.value)}
        onKeyPress={ev => {
          if (ctrlEnterIsPressed(ev)) {
            execute()
            setCmdline("")
          }
        }}
        rows={4} />
    </main>
  )
}

export const renderMain = () => {
  return (<Main />)
}

const ctrlEnterIsPressed = (ev: React.KeyboardEvent): boolean => {
  const onlyCtrl = ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey
  return onlyCtrl && ev.key === "Enter"
}
