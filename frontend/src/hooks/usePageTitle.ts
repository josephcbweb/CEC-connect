import { useEffect } from "react";

const BASE_TITLE = "CEC Connect";

/**
 * Sets the document title for the current page.
 * Appends the base title: "Page | CEC Connect"
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
