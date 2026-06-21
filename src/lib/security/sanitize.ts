import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3",
      "ul", "ol", "li", "blockquote", "a", "img", "pre", "code",
      "span", "div",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
  });
}

export function sanitizeText(text: string): string {
  return text.replace(/[<>]/g, "").trim();
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 50)
    .slice(0, 50);
}
