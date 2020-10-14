import React from "react"
import { DirTree } from "./dir_tree"
import { NodeId, NodeData, DirTreeHost } from "./dir_tree_types"

const ROOT_ID = 1
let lastId = ROOT_ID

const pathMap = new Map<NodeId, string>()

const addPath = (path: string): NodeId => {
  lastId++
  const nodeId = lastId

  pathMap.set(nodeId, path)
  return nodeId
}

const doUseNodeData = (nodeId: NodeId, host: DirTreeHost, workDir: string): NodeData | null => {
  const [nodeData, setNodeData] = React.useState<NodeData | null>(null)

  const nodePath = React.useMemo(() => {
    if (nodeId == ROOT_ID) {
      return host.rootPath
    }

    const nodePath = pathMap.get(nodeId)
    if (nodePath == null) {
      throw new Error("invalid node id")
    }
    return nodePath
  }, [])

  React.useEffect(() => {
    host.fs.stat(nodePath).then(async stats => {
      const nodeName = await host.path.basename(nodePath)

      if (stats.isDirectory) {
        const files = await host.fs.readdir(nodePath)
        const children = files.map(name => addPath(`${nodePath}/${name}`))
        setNodeData({
          id: nodeId,
          name: nodeName,
          kind: "DIRECTORY",
          children,

          // 後で判定する。
          autoExpand: false,
          autoFocus: false,
        })
        return
      }

      if (stats.isFile) {
        setNodeData({
          id: nodeId,
          name: nodeName,
          kind: "FILE",
        })
      }

      // TODO: unknown file. error
    })
  }, [])

  // autoExpand, autoFocus の更新
  React.useEffect(() => setNodeData(nodeData => {
    if (nodeData == null || nodeData.kind !== "DIRECTORY") {
      return nodeData
    }

    return {
      ...nodeData,
      autoExpand: workDir.includes(nodePath),
      autoFocus: workDir === nodePath,
    }
  }), [nodeData != null, workDir])

  return nodeData
}

const doSetWorkDir = (nodeId: NodeId, host: DirTreeHost): void => {
  const filepath = pathMap.get(nodeId)
  if (filepath == null) {
    return
  }

  host.setWorkDir(filepath)
}

export const DirTreeContainer: React.FC<{ host: DirTreeHost, workDir: string }> = props => {
  const { host, workDir } = props

  const useNodeData = React.useMemo(
    () => (nodeId: NodeId) => doUseNodeData(nodeId, host, workDir),
    [host, workDir],
  )

  const setWorkDir = React.useMemo(
    () => (nodeId: NodeId) => doSetWorkDir(nodeId, host),
    [host],
  )

  return (
    <DirTree rootId={ROOT_ID} useNodeData={useNodeData} setWorkDir={setWorkDir} />
  )
}
