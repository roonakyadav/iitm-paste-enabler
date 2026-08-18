(() => {
  const FLAG = "__iitm_paste_enabled";
  const isEnabled = () => {
    try { return localStorage.getItem(FLAG) !== "false"; }
    catch { return true; }
  };

  function getEditorFromTarget(target) {
    const input = target?.closest?.("textarea.ace_text-input");
    if (!input) return null;
    const container = input.closest(".ace_editor");
    if (!container || !window.ace) return null;
    try { return window.ace.edit(container); }
    catch { return null; }
  }

  // Handle Ctrl+V at the keyboard level. Because this runs directly from
  // the user's keypress, clipboard.readText() retains the browser's user
  // activation instead of being called later from DevTools.
  window.addEventListener("keydown", async (event) => {
    if (!isEnabled()) return;
    if (event.key.toLowerCase() !== "v" || (!event.ctrlKey && !event.metaKey) || event.altKey) return;

    const editor = getEditorFromTarget(event.target);
    if (!editor) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const text = await navigator.clipboard.readText();
      if (typeof text === "string") editor.insert(text);
    } catch (err) {
      console.warn("IITM Paste Enabler: clipboard read failed", err);
    }
  }, true);

  // Also handle normal paste events when a browser supplies clipboardData.
  window.addEventListener("paste", (event) => {
    if (!isEnabled()) return;
    const editor = getEditorFromTarget(event.target);
    if (!editor) return;

    const text = event.clipboardData?.getData("text/plain");
    if (text == null) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    editor.insert(text);
  }, true);

  console.log("IITM Paste Enabler: loaded");
})();
