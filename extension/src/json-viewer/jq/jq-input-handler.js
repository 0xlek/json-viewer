import debounce from '../utils/debounce';

class JqInputHandler {
  constructor(editor, onQueryChange) {
    this.editor = editor;
    this.onQueryChange = onQueryChange;
    this.currentQuery = '';
    this.debouncedQuery = debounce((query) => {
      this.executeQuery(query);
    }, 300);
  }

  show() {
    const dialogHtml = `
      <label style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600;">jq:</span>
        <input
          type="text"
          class="jq-query-input"
          placeholder=". | .foo (examples: ., .name, .[] | select(.x > 5))"
          style="flex: 1; padding: 6px 10px; font-family: monospace; border: 1px solid #ccc; border-radius: 4px;"
        />
      </label>
    `;

    this.editor.openDialog(dialogHtml, (query) => {
      this.currentQuery = query;
    }, {
      bottom: true,
      onInput: (e, query) => {
        this.currentQuery = query;
        if (query && query.trim()) {
          this.debouncedQuery(query);
        }
      },
      onClose: () => {
        this.debouncedQuery.cancel();
      }
    });

    const input = document.querySelector('.jq-query-input');
    if (input) {
      input.value = this.currentQuery;
      input.focus();
    }
  }

  executeQuery(query) {
    if (this.onQueryChange) {
      this.onQueryChange(query);
    }
  }

  close() {
    this.debouncedQuery.cancel();
    const dialog = document.querySelector('.CodeMirror-dialog');
    if (dialog && dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
  }

  getCurrentQuery() {
    return this.currentQuery;
  }
}

export default JqInputHandler;
