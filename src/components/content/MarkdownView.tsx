import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders markdown as React elements. Raw HTML is never injected. */
export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-content-muted prose-headings:text-content prose-strong:text-content prose-a:text-brand prose-code:text-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
