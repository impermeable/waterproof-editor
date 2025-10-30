## Compiling

Run
```
node esbuild.mjs --watch
```
and
```
npx tsc -b --watch
```
To build the sources. Note that setting the `watch` flag means that compilation starts over once file changes have been detected.

Alternatively, inside of VSCode/Codium run the `watch` task by opening the command pallete, using the command `Tasks: Run Task` and selecting `watch`.

## Linking the editor project during development

Running
```
npm link
```
in the waterproof-editor repo will allow you to locally link the package. The package can then be used in waterproof-vscode (or any other project) after running
```
npm link @impermeable/waterproof-editor
```
there.
The last command should be run _after_ a possible run of `npm ci`. 
Note that to use waterproof-editor in waterproof-vscode, waterproof-editor needs to be compiled.
It is useful to run the watch task for waterproof-editor, as described above.
Then, whenever a change occurs in waterproof-editor, that project is recompiled automatically.
In waterproof-vscode, the extension can be refreshed, for instance with `Ctrl+r` to see the effect of the changes.
## Using a WaterproofEditor in your own project

For an example of how to use a WaterproofEditor instance in your own project we refer to [waterproof-vscode](https://www.github.com/impermeable/waterproof-vscode).

More information can be found [here](./UsingWaterproofEditor.md).
