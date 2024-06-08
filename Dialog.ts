type Dialog = {
  nodes: DialogNode[]
}

export type NodeId = number

export type DialogPrimitiveValue = number | boolean | string

export type DialogValue = {
  value?: DialogPrimitiveValue
  sourceNodeId?: NodeId
}

export interface DialogNode {
  id: NodeId
  type: string
}

export default Dialog
