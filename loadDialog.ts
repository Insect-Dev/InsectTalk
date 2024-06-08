import Dialog from "./Dialog";

export class DialogCategory {
  static EXAMPLES = "examples";
}

export default async function loadDialog(
  name: string,
  category: string = DialogCategory.EXAMPLES
) {
  const file = Bun.file(`./dialogs/${category}/${name}.json`);
  const dialog = (await file.json()) as Dialog;

  return dialog;
}
