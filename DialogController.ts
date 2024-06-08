import Dialog, {
  ChoiceNode,
  DialogNode,
  DialogPrimitiveValue,
  DialogValue,
  EndNode,
  FunctionNode,
  IfNode,
  StartNode,
  TextNode,
  DelayNode,
  RandomSelectorNode,
  SwitchNode,
  DialogCondition,
  ShopNode,
} from "./Dialog";

type DialogMethod = (
  parameters: (DialogPrimitiveValue | undefined)[]
) => DialogPrimitiveValue | void;

const defaultOutput = (str: string, newLine: boolean = true) =>
  console.write(str, newLine ? "\n" : "");

const defaultInput = async (
  prompt: string = "",
  validate = (str: string) => str && str.trim().length > 0
) => {
  console.write(prompt);

  for await (const line of console) {
    if (validate(line)) {
      return line;
    }
  }

  throw new Error("No input");
};

export default class DialogController {
  private currentNode?: DialogNode;

  private methods: Record<string, DialogMethod> = {};

  constructor(
    private dialog: Dialog,
    private output = defaultOutput,
    private input = defaultInput
  ) {}

  registerMethod(newMethod: DialogMethod, methodName: string) {
    this.methods[methodName] = newMethod;
  }

  async start() {
    this.currentNode = this.dialog.nodes.find((node) => node.type === "start");

    if (!this.currentNode) {
      throw new Error("Missing start node");
    }

    while (true) {
      let nextNodeId = await this.handleNode(this.currentNode);
      if (!nextNodeId || nextNodeId === -1) break;
      this.currentNode = this.getNodeById(nextNodeId);
    }

    this.output("Encountered end node");
  }

  getNodeById(id: number) {
    const node = this.dialog.nodes.find((node) => node.id === id);
    if (!node) {
      throw new Error(`No node with id ${id}`);
    }
    return node;
  }

  async resolveDialogValue(dialogValue: DialogValue) {
    if (dialogValue.sourceNodeId) {
      const functionNode = this.getNodeById(dialogValue.sourceNodeId);

      const value = await this.handleReturningFunctionNode(
        functionNode as FunctionNode
      );

      return value;
    }

    return dialogValue.value!;
  }

  async evaluateCondition(condition: DialogCondition) {
    const value1 = await this.resolveDialogValue(condition.value1);
    const value2 = await this.resolveDialogValue(condition.value2);

    switch (condition.operator) {
      case "<":
        return value1 < value2;
      case "<=":
        return value1 <= value2;
      case "==":
        return value1 == value2;
      case "!=":
        return value1 != value2;
      case ">=":
        return value1 >= value2;
      case ">":
        return value1 > value2;
      default:
        throw new Error("Unhandled comparison");
    }
  }

  /**
   * @returns Next node(s) defined by current node. -1 means that an end node has been encountered
   */
  async handleNode(node: DialogNode) {
    let nextNode: number;

    switch (node.type) {
      case "start":
        nextNode = this.handleStart(node);
        break;
      case "end":
        nextNode = this.handleEnd(node);
        break;
      case "text":
        nextNode = await this.handleTextNode(node);
        break;
      case "choice":
        nextNode = await this.handleChoiceNode(node);
        break;
      case "function":
        nextNode = await this.handleVoidFunctionNode(node);
        break;
      case "if":
        nextNode = await this.handleIfNode(node);
        break;
      case "delay":
        nextNode = await this.handleDelayNode(node);
        break;
      case "randomSelector":
        nextNode = this.handleRandomSelectorNode(node);
        break;
      case "switch":
        nextNode = await this.handleSwitchNode(node);
        break;
      case "shop":
        nextNode = await this.handleShopNode(node);
        break;
      default:
        throw new Error("Unhandled node type");
    }
    return nextNode;
  }

  handleStart(node: StartNode) {
    return node.next;
  }

  handleEnd(node: EndNode) {
    return node.next;
  }

  async handleTextNode(node: TextNode) {
    this.output(`Dialog: ${node.text}`, false);
    await this.input("", (_) => true);

    return node.next;
  }

  async handleChoiceNode(node: ChoiceNode) {
    this.output(`Choice: ${node.prompt}`);

    node.choices.forEach((choice, i) => {
      this.output(`Option ${i + 1}: ${choice.text}`);
    });

    const answer = parseInt(
      await this.input(`Chose an option (1-${node.choices.length}): `)
    );

    return node.choices[answer - 1].next;
  }

  async handleIfNode(node: IfNode) {
    if (await this.evaluateCondition(node.condition)) {
      return node.trueBranch;
    } else {
      return node.falseBranch;
    }
  }

  async handleVoidFunctionNode(node: FunctionNode) {
    if (node.returnType !== "void") {
      throw new Error("Function must return void");
    }

    const method = this.methods[node.methodName];

    if (!method) {
      throw new Error(`No method with name ${node.methodName}`);
    }

    method(
      await Promise.all(
        node.parameters?.map(async (param) => {
          const value = await this.resolveDialogValue(param);
          return value;
        }) ?? []
      )
    );

    return node.next!;
  }

  async handleReturningFunctionNode(node: FunctionNode) {
    if (node.returnType === "void") {
      throw new Error("Function must return value");
    }

    const method = this.methods[node.methodName];

    if (!method) {
      throw new Error(`No method with name ${node.methodName}`);
    }

    const result = method(
      await Promise.all(
        node.parameters?.map(async (param) => {
          const value = await this.resolveDialogValue(param);
          return value;
        }) ?? []
      )
    );

    return result as DialogPrimitiveValue;
  }

  async handleDelayNode(node: DelayNode) {
    await Bun.sleep(node.length);

    return node.next;
  }

  async handleSwitchNode(node: SwitchNode) {
    for (const switchCase of node.cases) {
      const conditionMet = await this.evaluateCondition(switchCase.condition);

      if (conditionMet) {
        return switchCase.next;
      }
    }

    return node.defaultCase;
  }

  async handleShopNode(node: ShopNode) {
    this.output("Welcome to the shop! Here are the available items:");

    node.items.forEach((item, index) => {
      this.output(
        `Item ${index + 1}: ${item.name} - ${item.description} (Price: ${
          item.price
        })`
      );
    });

    const answer = parseInt(
      await this.input(`Choose an item to purchase (1-${node.items.length}): `)
    );

    const selectedItem = node.items[answer - 1];
    this.output(
      `You have selected ${selectedItem.name}. This would trigger the purchase logic.`
    );

    // Implement the purchase logic here
    // ...

    return node.next;
  }

  handleRandomSelectorNode(node: RandomSelectorNode) {
    const randomIndex = Math.floor(Math.random() * node.branches.length);
    return node.branches[randomIndex];
  }
}
