/**
 * src/AppIslands.jsx
 * ==================
 * govstruct's island registry - empty by design.
 *
 * The product's own payload (the apps menu) is SERVER-RENDERED in
 * pages/Home.jsx, not an island: the doctrine (PRD 5) is that the pane must
 * exist in the served HTML as a plain anchor, so a crawler reads it without
 * running JS. Register an island here only for a surface that genuinely needs
 * the browser (localStorage, fetch, a live widget) - the fallback content
 * inside <pre-island> renders for crawlers, the component for humans.
 *
 * Usage in a page's JSX:
 *
 *   <pre-island data-pre-island="recently-viewed" />
 *   <pre-island data-pre-island="cart-widget" data-pre-load="visible">
 *     <span className="island-loading">Loading cart...</span>
 *   </pre-island>
 */

export const islands = {
  // 'your-island': YourIsland,
}
