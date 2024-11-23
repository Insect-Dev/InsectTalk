import { DialogNode, NodeId } from '../Dialog'
import DialogController, { NodeHandler } from '../DialogController'

export type ShopItem = {
  name: string
  description: string
  price: number
  next?: NodeId
}

export class ShopNode implements DialogNode {
  type = 'shop'

  constructor(
    public id: NodeId,
    public items: ShopItem[],
    public next: NodeId,
  ) {}
}

const handleShopNode: NodeHandler = async (
  node: DialogNode,
  controller: DialogController,
) => {
  const shopNode = node as ShopNode

  controller.getStandardOutput()(
    'Welcome to the shop! Here are the available items:',
  )

  shopNode.items.forEach((item, index) => {
    controller.getStandardOutput()(
      `Item ${index + 1}: ${item.name} - ${item.description} (Price: ${
        item.price
      })`,
    )
  })

  const answer = parseInt(
    await controller.getStandardInput()(
      `Choose an item to purchase (1-${shopNode.items.length} and 0 to exit): `,
    ),
  )

  if (answer == 0) {
    return shopNode.next
  }

  const selectedItem = shopNode.items[answer - 1]
  controller.getStandardOutput()(`You have selected ${selectedItem.name}. This would trigger the purchase logic.`)

  controller.getStandardOutput()(`You have been charged $${selectedItem.price}`)
  
  return selectedItem.next ?? shopNode.id
}

const registerAdvancedNodes = (controller: DialogController) => {
  controller.registerNodeHandler('shop', handleShopNode)
}

export { registerAdvancedNodes, handleShopNode }
