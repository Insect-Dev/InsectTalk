import Dialog, { DialogNode, DialogPrimitiveValue, DialogValue } from './Dialog'
import {
  FunctionNode,
  handleReturningFunctionNode,
  registerBuiltinNodes,
} from './nodes/built-in'

type DialogMethod = (
  parameters: (DialogPrimitiveValue | undefined)[],
) => DialogPrimitiveValue | void

export type NodeHandler = (
  node: DialogNode,
  controller: DialogController,
) => Promise<number> | number

const defaultOutput = (str: string, newLine: boolean = true) =>
  console.write(str, newLine ? '\n' : '')

const defaultInput = async (
  prompt: string = '',
  validate = (str: string) => str && str.trim().length > 0,
) => {
  console.write(prompt)

  for await (const line of console) {
    if (validate(line)) {
      return line
    }
  }

  throw new Error('No input')
}

export default class DialogController {
  private currentNode?: DialogNode

  private nodeHandlers: Record<string, NodeHandler> = {}

  private methods: Record<string, DialogMethod> = {}

  constructor(
    private dialog: Dialog,
    private output = defaultOutput,
    private input = defaultInput,
  ) {
    registerBuiltinNodes(this)
  }

  registerMethod(methodName: string, newMethod: DialogMethod) {
    this.methods[methodName] = newMethod
  }

  getMethods() {
    return this.methods
  }

  registerNodeHandler(type: string, handler: NodeHandler) {
    if (!this.nodeHandlers.hasOwnProperty(type)) {
      this.nodeHandlers[type] = handler
    } else {
      throw new Error(`Node with type '${type}' has already been registered`)
    }
  }

  getStandardOutput() {
    return this.output
  }

  getStandardInput() {
    return this.input
  }

  async start() {
    this.currentNode = this.dialog.nodes.find((node) => node.type === 'start')

    if (!this.currentNode) {
      throw new Error('Missing start node')
    }

    while (true) {
      let nextNodeId = await this.handleNode(this.currentNode)
      if (!nextNodeId || nextNodeId === -1) break
      this.currentNode = this.getNodeById(nextNodeId)
    }

    this.output('Encountered end node')
  }

  getNodeById(id: number) {
    const node = this.dialog.nodes.find((node) => node.id === id)
    if (!node) {
      throw new Error(`No node with id ${id}`)
    }
    return node
  }

  public async resolveDialogValue(dialogValue: DialogValue) {
    if (dialogValue.sourceNodeId) {
      const functionNode = this.getNodeById(dialogValue.sourceNodeId)

      const value = await handleReturningFunctionNode(
        functionNode as FunctionNode,
        this,
      )

      return value
    }

    return dialogValue.value!
  }

  /**
   * @returns Next node(s) defined by current node. -1 means that an end node has been encountered
   */
  async handleNode(node: DialogNode) {
    const handler = this.nodeHandlers[node.type]
    if (!handler) {
      throw new Error(`No handler registered for node type: ${node.type}`)
    }
    return await handler(node, this)
  }
}
