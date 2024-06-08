type Dialog = {
  nodes: DialogNode[]
}

type NodeId = number

type DialogPrimitiveValue = number | boolean | string

type DialogValue = {
  value?: DialogPrimitiveValue
  sourceNodeId?: NodeId
}

type DialogCondition = {
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>'
  value1: DialogValue
  value2: DialogValue
}

type StartNode = {
  id: NodeId
  type: 'start'
  next: NodeId
}

type EndNode = {
  id: NodeId
  type: 'end'
  next: -1
}

type TextNode = {
  id: NodeId
  type: 'text'
  text: string
  next: NodeId
}

type ChoiceNode = {
  id: NodeId
  type: 'choice'
  prompt: string
  choices: {
    text: string
    next: NodeId
  }[]
}

type IfNode = {
  id: NodeId
  type: 'if'
  condition: DialogCondition
  trueBranch: NodeId
  falseBranch: NodeId
}

type FunctionNode = {
  id: NodeId
  type: 'function'
  methodName: string
  parameters?: DialogValue[]
  returnType: 'void' | 'number' | 'boolean' | 'string'
  next?: NodeId
}

type DelayNode = {
  id: NodeId
  type: 'delay'
  length: number
  next: NodeId
}

type RandomSelectorNode = {
  id: NodeId
  type: 'randomSelector'
  branches: NodeId[]
}

type SwitchNode = {
  id: NodeId
  type: 'switch'
  switchValue: DialogValue
  cases: {
    condition: DialogCondition
    next: NodeId
  }[]
  defaultCase: NodeId
}

type ShopNode = {
  id: NodeId
  type: 'shop'
  items: {
    name: string
    description: string
    price: number
    next?: NodeId
  }[]
  next: NodeId
}

type DialogNode =
  | StartNode
  | EndNode
  | TextNode
  | ChoiceNode
  | IfNode
  | FunctionNode
  | DelayNode
  | RandomSelectorNode
  | SwitchNode
  | ShopNode

export default Dialog
export {
  DialogPrimitiveValue,
  DialogValue,
  DialogCondition,
  NodeId,
  TextNode,
  ChoiceNode,
  IfNode,
  FunctionNode,
  StartNode,
  EndNode,
  DialogNode,
  DelayNode,
  RandomSelectorNode,
  SwitchNode,
  ShopNode,
}
