export type NodeId = number

export type NodeData =
  {
    id: NodeId
    name: string
  } & ({
    kind: "FILE"
    // icon, etc.
  } | {
    kind: "DIRECTORY"
    autoExpand: boolean
    autoFocus: boolean
    children: NodeId[]
  }) // or link

export interface DirTreeHost {
  rootPath: string

  setWorkDir: (path: string) => void

  fs: {
    readdir: (path: string) => Promise<string[]>
    stat: (path: string) => Promise<{
      isDirectory: boolean
      isFile: boolean
    }>
  }

  path: {
    basename: (path: string) => Promise<string>
  }
}
