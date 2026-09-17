import * as React from "react"

/**
 * How many cards fit across at the current width.
 *
 * The article list builds its rows in JavaScript rather than letting the grid
 * wrap, so it has to know the column count to build rows that come out full.
 * Reading it from the same breakpoints Tailwind uses keeps the two in step: a
 * row of three built for a desktop would wrap to 2 + 1 on a tablet, which is
 * the ragged tail this is all meant to avoid.
 */

/** Tailwind's `sm` and `lg`. */
const TWO_COLUMN_BREAKPOINT = 640
const THREE_COLUMN_BREAKPOINT = 1024

function currentColumns() {
  if (typeof window === "undefined") return 3
  if (window.innerWidth >= THREE_COLUMN_BREAKPOINT) return 3
  if (window.innerWidth >= TWO_COLUMN_BREAKPOINT) return 2
  return 1
}

export function useColumnCount() {
  const [columns, setColumns] = React.useState(currentColumns)

  React.useEffect(() => {
    const queries = [TWO_COLUMN_BREAKPOINT, THREE_COLUMN_BREAKPOINT].map(width =>
      window.matchMedia(`(min-width: ${width}px)`),
    )

    const onChange = () => setColumns(currentColumns())

    queries.forEach(query => query.addEventListener("change", onChange))
    onChange()

    return () => queries.forEach(query => query.removeEventListener("change", onChange))
  }, [])

  return columns
}
