export function insertIntoActiveTextarea(
  currentText: string,
  insertedText: string,
  setText: (text: string) => void
) {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;

  if (!textarea) {
    setText(currentText + insertedText);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextText = currentText.slice(0, start) + insertedText + currentText.slice(end);
  const nextCursor = start + insertedText.length;

  setText(nextText);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(nextCursor, nextCursor);
  }, 0);
}
