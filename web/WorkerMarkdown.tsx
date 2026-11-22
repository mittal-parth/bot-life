import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export default function WorkerMarkdown({ text }: { text: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        img: ({ alt, src }) => (
          <a href={src} target="_blank" rel="noreferrer">
            {alt || "View image"}
          </a>
        ),
      }}
    >
      {text}
    </Markdown>
  );
}
