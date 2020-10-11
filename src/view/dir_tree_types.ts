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
    children: NodeId[]
  }) // or link

export interface DirTreeHost {
  rootPath: string

  fs: {
    stat: (path: string) => Promise<{
      isDirectory: boolean
      isFile: boolean
    }>
    readdir: (path: string) => Promise<string[]>
  }

  path: {
    basename: (path: string) => Promise<string>
  }
}
