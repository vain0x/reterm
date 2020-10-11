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

const doUseNodeData = (nodeId: NodeId, host: DirTreeHost): NodeData | null => {
  const [nodeData, setNodeData] = React.useState<NodeData | null>(null)

  React.useEffect(() => {
    const nodePath = nodeId == ROOT_ID ? host.rootPath : pathMap.get(nodeId)
    if (nodePath == null) {
      throw new Error("invalid node id")
    }

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

  return nodeData
}

export const DirTreeContainer: React.FC<{ host: DirTreeHost }> = ({ host }) => {
  const useNodeData = React.useMemo(() => (nodeId: number) => doUseNodeData(nodeId, host), [])

  return (
    <DirTree rootId={ROOT_ID} useNodeData={useNodeData} />
  )
}
