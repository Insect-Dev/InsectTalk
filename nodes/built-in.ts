import {
  DialogNode,
  DialogPrimitiveValue,
  DialogValue,
  NodeId,
} from '../Dialog'
import DialogController from '../DialogController'

export class StartNode implements DialogNode {
  type = 'start'

  constructor(
    public id: NodeId,
    public next: NodeId,
  ) {}
}

export class EndNode implements DialogNode {
  type = 'end'
  next = -1

  constructor(public id: NodeId) {}
}

export class TextNode implements DialogNode {
  type = 'text'

  constructor(
    public id: NodeId,
    public text: string,
    public next: NodeId,
  ) {}
}

export class FunctionNode implements DialogNode {
  readonly type = 'function'

  constructor(
    public id: NodeId,
    public methodName: string,
    public returnType: 'void' | 'number' | 'boolean' | 'string',
    public parameters?: DialogValue[],
    public next?: NodeId,
  ) {}
}

const handleVoidFunctionNode = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const functionNode = node as FunctionNode

  if (functionNode.returnType !== 'void') {
    throw new Error('Function must return void')
  }

  const method = controller.getMethods()[functionNode.methodName]

  if (!method) {
    throw new Error(`No method with name ${functionNode.methodName}`)
  }

  method(
    await Promise.all(
      functionNode.parameters?.map(async (param) => {
        const value = await controller.resolveDialogValue(param)
        return value
      }) ?? [],
    ),
  )

  return functionNode.next!
}

const handleStartNode = (node: DialogNode, controller: DialogController) => {
  return (node as StartNode).next
}

const handleEndNode = (node: DialogNode, controller: DialogController) => {
  return (node as EndNode).next
}

const handleTextNode = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const textNode = node as TextNode

  controller.getStandardOutput()(`Dialog: ${textNode.text}`, false)
  await controller.getStandardInput()('', (_) => true)

  return textNode.next
}

const handleReturningFunctionNode = async (
  node: FunctionNode,
  controller: DialogController,
) => {
  if (node.returnType === 'void') {
    throw new Error('Function must return value')
  }

  const method = controller.getMethods()[node.methodName]

  if (!method) {
    throw new Error(`No method with name ${node.methodName}`)
  }

  const result = method(
    await Promise.all(
      node.parameters?.map(async (param) => {
        const value = await controller.resolveDialogValue(param)
        return value
      }) ?? [],
    ),
  )

  return result as DialogPrimitiveValue
}

const registerBuiltinNodes = (controller: DialogController) => {
  controller.registerNodeHandler('start', handleStartNode)
  controller.registerNodeHandler('end', handleEndNode)

  controller.registerNodeHandler('text', handleTextNode)

  controller.registerNodeHandler('function', handleVoidFunctionNode)
}

export {
  registerBuiltinNodes,
  handleStartNode,
  handleEndNode,
  handleVoidFunctionNode,
  handleReturningFunctionNode,
}
