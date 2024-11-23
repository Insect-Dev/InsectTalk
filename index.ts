import DialogController from './DialogController'
import loadDialog from './loadDialog'
import { registerAdvancedNodes } from './nodes/advanced'
import { registerFlowControlNodes } from './nodes/flow-control'

const dialog = await loadDialog('allNodes')

const dialogController = new DialogController(dialog)

registerFlowControlNodes(dialogController)

registerAdvancedNodes(dialogController)

dialogController.registerMethod('giveQuest', (args) => {
  console.log('Added quest', args[0])
})

dialogController.registerMethod('getTiredLevel', () => {
  const tiredLevel = Math.round(Math.random() * 10)
  console.log('Tired Level: ', tiredLevel)
  return tiredLevel
})
dialogController.registerMethod('encounterEnemy', (args) => {
  console.log(`Found an enemy: ${args[0]}`)
})

await dialogController.start()

process.exit(0)
