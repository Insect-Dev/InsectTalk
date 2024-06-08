import { DialogNode, DialogValue, NodeId } from '../Dialog'
import DialogController, { NodeHandler } from '../DialogController'

export type DialogCondition = {
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>'
  value1: DialogValue
  value2: DialogValue
}

export class ChoiceNode implements DialogNode {
  type = 'choice'
  constructor(
    public id: NodeId,
    public prompt: string,
    public choices: {
      text: string
      next: NodeId
    }[],
  ) {}
}

export class IfNode implements DialogNode {
  type = 'if'
  constructor(
    public id: NodeId,
    public condition: DialogCondition,
    public trueBranch: NodeId,
    public falseBranch: NodeId,
  ) {}
}

export class DelayNode implements DialogNode {
  type = 'delay'
  constructor(
    public id: NodeId,
    public length: number,
    public next: NodeId,
  ) {}
}

export class RandomSelectorNode implements DialogNode {
  type = 'randomSelector'
  constructor(
    public id: NodeId,
    public branches: NodeId[],
  ) {}
}

export class SwitchNode implements DialogNode {
  type = 'switch'
  constructor(
    public id: NodeId,
    public switchValue: DialogValue,
    public cases: {
      condition: DialogCondition
      next: NodeId
    }[],
    public defaultCase: NodeId,
  ) {}
}

const evaluateCondition = async (
  condition: DialogCondition,
  controller: DialogController,
) => {
  const value1 = await controller.resolveDialogValue(condition.value1)
  const value2 = await controller.resolveDialogValue(condition.value2)

  switch (condition.operator) {
    case '<':
      return value1 < value2
    case '<=':
      return value1 <= value2
    case '==':
      return value1 == value2
    case '!=':
      return value1 != value2
    case '>=':
      return value1 >= value2
    case '>':
      return value1 > value2
    default:
      throw new Error('Unhandled comparison')
  }
}

const handleChoiceNode: NodeHandler = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const choiceNode = node as ChoiceNode

  controller.getStandardOutput()(`Choice: ${choiceNode.prompt}`)

  choiceNode.choices.forEach((choice, i) => {
    controller.getStandardOutput()(`Option ${i + 1}: ${choice.text}`)
  })

  const answer = parseInt(
    await controller.getStandardInput()(
      `Chose an option (1-${choiceNode.choices.length}): `,
    ),
  )

  return choiceNode.choices[answer - 1].next
}

const handleIfNode: NodeHandler = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const ifNode = node as IfNode

  if (await evaluateCondition(ifNode.condition, controller)) {
    return ifNode.trueBranch
  } else {
    return ifNode.falseBranch
  }
}

const handleDelayNode: NodeHandler = async (
  node: DialogNode,
  _controller: DialogController,
) => {
  const delayNode = node as DelayNode

  await Bun.sleep(delayNode.length)

  return delayNode.next
}

const handleSwitchNode: NodeHandler = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const switchNode = node as SwitchNode

  for (const switchCase of switchNode.cases) {
    const conditionMet = await evaluateCondition(
      switchCase.condition,
      controller,
    )

    if (conditionMet) {
      return switchCase.next
    }
  }

  return switchNode.defaultCase
}

const handleRandomSelectorNode = (node: DialogNode) => {
  const randomSelectorNode = node as RandomSelectorNode
  const randomIndex = Math.floor(
    Math.random() * randomSelectorNode.branches.length,
  )
  return randomSelectorNode.branches[randomIndex]
}

const registerFlowControlNodes = (controller: DialogController) => {
  controller.registerNodeHandler('choice', handleChoiceNode)
  controller.registerNodeHandler('if', handleIfNode)
  controller.registerNodeHandler('delay', handleDelayNode)
  controller.registerNodeHandler('switch', handleSwitchNode)
  controller.registerNodeHandler('randomSelector', handleRandomSelectorNode)
}

export {
  registerFlowControlNodes,
  handleChoiceNode,
  handleIfNode,
  handleDelayNode,
  handleSwitchNode,
}
