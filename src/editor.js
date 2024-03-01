export const createEditors = (selector, options) =>
  Array.from(document.querySelectorAll(selector)).map((root) =>
    createEditor(root, options)
  );

export const createEditor = (
  root,
  { highlight = (x) => x, tabSize = 0 } = {}
) => {
  const code = Array.from(root.getElementsByTagName("code"))
    .map((line) => {
      if (tabSize === 0) {
        const firstIndent =
          line.textContent.match(/(?<=^|\n)[^\S\n]+/)?.[0].length;
        if (firstIndent > 0) tabSize = firstIndent;
      }
      return line.textContent;
    })
    .reduce((acc, line) => acc + "\n" + line);

  tabSize ||= 4;

  root.innerHTML = "";

  const textarea = root.appendChild(document.createElement("textarea"));
  textarea.value = code;
  textarea.spellcheck = false;
  textarea.wrap = "off";
  textarea.style.caretColor = getComputedStyle(root).color;
  textarea.style.tabSize = tabSize;

  const list = root.appendChild(document.createElement("dl"));

  textarea.addEventListener(
    "input",
    throttle((e) => {
      const lines = e.target.value.split("\n");
      const elements = Array.from(list.childNodes);

      // Expand the list to fit the number of lines
      for (let i = elements.length / 2; i < lines.length; i++) {
        list.appendChild(document.createElement("dt"));
        const item = document.createElement("dd");
        item.appendChild(document.createElement("code"));
        list.appendChild(item);
      }

      // Shrink the list to fit the number of lines
      for (let i = lines.length; i < elements.length / 2; i++) {
        list.removeChild(elements[i * 2]);
        list.removeChild(elements[i * 2 + 1]);
      }

      // Update the list with the new lines
      for (let i = 0; i < lines.length; i++) {
        const items = list.childNodes;

        const number = items[i * 2];
        const code = items[i * 2 + 1].firstChild;

        number.textContent = i + 1;
        code.innerHTML = highlight(lines[i].replace(/\t/g, " ".repeat(4)));
      }
    })
  );
  textarea.dispatchEvent(new Event("input"));

  textarea.addEventListener("scroll", (e) => {
    root.style.setProperty("--doodlit-scroll-left", e.target.scrollLeft + "px");
    root.style.setProperty("--doodlit-scroll-top", e.target.scrollTop + "px");
  });

  textarea.addEventListener("keydown", (e) => {
    const { target, key } = e;
    const { value, selectionStart: selStart, selectionEnd: selEnd } = target;
    if (!["Tab", "Enter", "Backspace"].includes(key)) return;
    if (e.defaultPrevented || e.metaKey || e.altKey || e.ctrlKey) return;

    const selWidth = selEnd - selStart,
      multiline = selStart !== selEnd && value.indexOf("\n", selStart) < selEnd;

    if (!multiline && key === "Tab" && !e.shiftKey)
      insert(target, " ".repeat(tabSize));
    else {
      const prev = (pos) => value.lastIndexOf("\n", pos);
      const next = (pos, end = value.indexOf("\n", pos)) =>
        end < 0 ? value.length : end;
      const range = (start, end) => target.setSelectionRange(start, end);

      const blockStart = prev(selStart - 1) + 1,
        blockEnd = next(selEnd);

      const block = value.slice(blockStart, blockEnd),
        fullIndent = block.match(/^\s*/)[0].length;

      if (key === "Enter") {
        if (block.trim().length === 0) range(blockStart, selEnd);

        insert(target, `\n${" ".repeat(fullIndent)}`);
      } else if (multiline && key === "Tab" && !e.shiftKey) {
        const shifted = block.replaceAll(/^|\n/g, `$&${" ".repeat(tabSize)}`);
        const shiftSize = shifted.length - block.length;

        range(blockStart, blockEnd);
        insert(target, shifted);
        range(selStart + tabSize, selEnd + shiftSize);
      } else if (key === "Backspace" || (key === "Tab" && e.shiftKey)) {
        const start = blockStart + fullIndent;
        if (
          key === "Backspace" &&
          (selWidth > 0 || selStart !== start || blockStart === selStart)
        )
          return;

        let indentSize = Math.max(getIndent(value, start), tabSize);
        if (indentSize >= tabSize * 2) indentSize = tabSize;

        const shiftRegex = new RegExp(`(?<=^|\n) {1,${indentSize}}`, "g");
        const shifted = block.replaceAll(shiftRegex, "");
        const shiftSize = shifted.length - block.length;

        if (shiftSize !== 0) {
          const firstIndent = -Math.min(indentSize, fullIndent);
          range(blockStart, blockEnd);
          insert(target, shifted);
          if (key === "Tab") range(selStart + firstIndent, selEnd + shiftSize);
          if (key === "Backspace")
            range(selStart + firstIndent, selEnd + shiftSize);
        }
      } else return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
  });
};

// Utility functions

const throttle =
  (fn, delay = 0, handled = false) =>
  (...args) => {
    if (handled) return;
    if (typeof fn === "number") [fn, delay] = [delay, fn];

    handled = true;
    requestAnimationFrame(() => (handled = false));
    return fn(...args);
  };

const insert = (element, text) => {
  const activeElement = document.activeElement;
  if (activeElement !== element) element.focus();

  if (text === "") document.execCommand("delete");
  else document.execCommand("insertText", false, text);

  if (activeElement === document.body || !activeElement) element.blur();
  else if (activeElement !== element) activeElement?.focus();
};

const getIndent = (text, start) => {
  const last = (pos) => text.lastIndexOf("\n", pos);
  const next = (pos) => text.indexOf("\n", pos);

  const lineStart = last(start - 1) + 1;
  const line = text.slice(lineStart, next(lineStart));
  const fullIndent = line.match(/^\s*/)[0].length;

  let previousIndent = 0;
  let previous = last(lineStart - 2) + 1;
  for (let i = previous; i >= 0; i = last(i - 2) + 1) {
    if (i === previous) break;

    const curLine = text.slice(i, next(i));
    if (curLine.trim().length === 0) continue;

    const curIndent = curLine.match(/^\s*/)[0].length;
    if (curIndent >= fullIndent) continue;

    previousIndent = curIndent;
    break;
  }

  return fullIndent - previousIndent;
};
