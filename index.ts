import DialogController from "./DialogController";
import loadDialog from "./loadDialog";

const dialog = await loadDialog("allNodes");

const dialogController = new DialogController(dialog);

dialogController.registerMethod((args) => {
  console.log("Added quest", args[0]);
}, "giveQuest");

dialogController.registerMethod(() => {
  const tiredLevel = Math.round(Math.random() * 10);
  console.log("Tired Level: ", tiredLevel);
  return tiredLevel;
}, "getTiredLevel");
dialogController.registerMethod((args) => {
  console.log(`Found an enemy: ${args[0]}`);
}, "encounterEnemy");

await dialogController.start();

process.exit(0);
