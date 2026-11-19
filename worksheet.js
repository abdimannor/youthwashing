// Print button on the worksheet: no inline handlers in the HTML.
document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});
