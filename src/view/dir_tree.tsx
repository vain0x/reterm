import React from "react"
import { exhaust } from "../shared/exhaust"
import { NodeId, NodeData } from "./dir_tree_types"

interface TreeProps {
  rootId: NodeId
  useNodeData: (nodeId: NodeId) => NodeData | null
}

type NodeProps = {
  nodeId: NodeId
  tree: TreeProps
}

interface DirNodeProps {
  nodeData: NodeData & { kind: "DIRECTORY" }
  tree: TreeProps
}

export const DirTree: React.FC<TreeProps> = props => {
  const { rootId } = props

  const root = props.useNodeData(rootId)
  if (root == null) {
    return (
      <div />
    )
  }

  return (
    <article className="g-dir-tree g-flex-column">
      <h1>
        {root.name}
      </h1>

      {root.kind === "DIRECTORY" ? (
        <ul className="dir-tree-contents g-flex-column">
          {root.children.map(childId => (
            <Node key={childId} nodeId={childId} tree={props} />
          ))}
        </ul>
      ) : "Not a directory."}
    </article>
  )
}

// トップレベルは li
const Node: React.FC<NodeProps> = props => {
  const { nodeId, tree } = props
  const nodeData = tree.useNodeData(nodeId)
  if (nodeData == null) {
    return (<li>...</li>)
  }

  switch (nodeData.kind) {
    case "FILE":
      return (
        <li className="dir-tree-row">
          {"○ " + nodeData.name}
        </li>
      )

    case "DIRECTORY":
      return (<DirNode nodeData={nodeData} tree={tree} />)

    default:
      throw exhaust(nodeData)
  }
}

const DirNode: React.FC<DirNodeProps> = props => {
  const { nodeData, tree } = props
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <li className="g-flex-column">
      <div className="dir-tree-row g-flex-row" onClick={() => {
        setIsExpanded(!isExpanded)
      }} style={{ cursor: "pointer" }}>
        <div>
          {isExpanded ? "ｖ" : "＞"}
        </div>

        <h2>
          {nodeData.name}
        </h2>
      </div>

      {isExpanded ? (
        <ul className="dir-tree-contents g-flex-column">
          {nodeData.children.map(childId => (
            <Node key={childId} nodeId={childId} tree={tree} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
