## Using a WaterproofEditor instance in your own project



### Document constructor
The document constructor is responsible for bringing the input document (of type `string`) into a `WaterproofDocument` (see [below](#waterproofdocument)). 

The `WaterproofDocument` serves as an intermediate representation of the input file. From this we construct a `WaterproofMapping` object (see [below](#waterproofmapping)) and the [ProseMirror](https://prosemirror.net/) document that is shown on the page. 

#### Example document constructor
An example can be found in [the waterproof-vscode repository](https://github.com/impermeable/waterproof-vscode/blob/main/editor/src/document-construction/construct-document.ts). In `waterproof-vscode` we work with `.mv` files (Markdown files containing Rocq code, which use the `.v` file extension).

In our `.mv` constructor, parts surrounded by `<input-area>` and `</input-area>` are mapped to `InputAreaBlock`s, parts surrounded by `<hint title="{some title}">` and `</hint>` are mapped to `HintBlock`s, parts surrounded by ` ```coq ` and ` ``` ` are translated to `CodeBlock`s, etc.

### WaterproofDocument
It may be helpful to think of a WaterproofDocument in terms of the following "grammar":
```
WaterproofDocument  ::= Block+

Block               ::= HintBlock | InputAreaBlock | MarkdownBlock | CodeBlock | MathDisplayBlock | NewlineBlock

InnerBlock          ::= MarkdownBlock | CodeBlock | MathDisplayBlock | NewlineBlock

HintBlock           ::= Container of InnerBlock+ with a title.
InputAreaBlock      ::= Container of InnerBlock+

MarkdownBlock       ::= A container with markdown content (supports inline LaTeX).
CodeBlock           ::= A container with code content.
MathDisplayBlock    ::= A container with LaTeX content that should be rendered in math display mode.
NewlineBlock        ::= A block that keeps track of significant newlines
```

The schema `WaterproofSchema` defined in [`src/schema/schema.ts`](../src/schema/schema.ts) follows from the above grammar.

### WaterproofEditorConfig

The `WaterproofEditorConfig` object is used to configure an `WaterproofEditor` instance. The user is required to supply:
- `documentConstructor`: a [document constructor](#document-constructor).
- `symbols`: symbol completions, completion starts when the `\` character is pressed and are used for notation symbols (in the style of LaTeX commands, like `\alpha` for `α`).
- `completions`: language completions, in the case of `waterproof-vscode` used for entering "tactics" (eg. `We take that ...`).
- `api`: an object specifying different callbacks that the editor uses to communicate to the containing process (in the case of `waterproof-vscode` this is used to communicate back to the vscode extension). See [below](#api-object) for more information.

#### Api object
- `executeCommand: (command: string, time: number) => void`: Used by the editor to execute a command in the document.
- `executeHelp: () => void`: Executed by the editor when the user asks for help via the keybinding or the context menu entry.
- `editorReady: () => void`: Used by the editor to communicate that it is ready.
- `documentChange: (change: DocChange | WrappingDocChange) => void`: The editor will call this function on every change that is made to the underlying document. 
- `applyStepError: (errorMessage: string) => void`: Only ever used by the editor once an unrecoverable error has occured when mapping changes    
- `cursorChange: (cursorPosition: number) => voi`: Used by the editor to communicate the current cursor position, `cursorPosition` is an offset based position into the document. 
- `lineNumbers: (linenumbers: Array<number>, version: number) => void`: Used to communicate that the linenumbers need to be recomputed for the current document
- `viewportHint: (start: number, end: number) => void`: Fired by the editor when the viewport (the user visible part of the editor changes)
