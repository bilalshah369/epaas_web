/**
 * After a form validation failure, scroll the page to the first visible
 * error message and focus its associated input so the user knows exactly
 * what needs attention.
 *
 * Relies on every errMsg() helper rendering a div with
 * className="form-field-error". Uses setTimeout(0) so the call fires after
 * React has flushed the state update and painted the error divs.
 */
export function scrollToFirstError() {
  setTimeout(() => {
    const errors = document.querySelectorAll<HTMLElement>('.form-field-error');
    if (!errors.length) return;

    // querySelectorAll returns elements in document (top-to-bottom) order
    const first = errors[0];
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Try to focus the nearest preceding focusable sibling or parent input
    const focusable = first.closest<HTMLElement>('div, section')
      ?.querySelector<HTMLElement>('input, select, textarea');
    try { focusable?.focus({ preventScroll: true }); } catch {}
  }, 0);
}
