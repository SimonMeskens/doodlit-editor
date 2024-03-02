# Doodlit Editor

A tiny HTML5 editor. Try out [the demo](https://simonmeskens.github.io/doodlit-editor/demo)!

## API Documentation

### createEditors(selector, options)

Creates Doodlit editors for the specified selector.

- `selector` (string): The CSS selector for the elements to turn into editors.
- `options` (object): Optional configuration options for the editors.
  - `highlight` (function): a function that takes the source code and returns the highlighted HTML code.
  - `tabSize` (number): the indentation size in spaces.

Example usage (theme file is optional):

```html
<link rel="stylesheet" type="text/css" href="https://simonmeskens.github.io/doodlit-editor/src/theme.css" />
<link rel="stylesheet" type="text/css" href="https://simonmeskens.github.io/doodlit-editor/src/editor.css" />
<script type="module">
  import { createEditors } from "https://simonmeskens.github.io/doodlit-editor/src/editor.js";
  import { highlight as microlight } from "./microlight.js";

  createEditors(".code-editor", { highlight: microlight });
</script>
```