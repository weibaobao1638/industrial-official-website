import type { CSSProperties } from 'react';

type RichTextProps = {
  content?: string;
  className?: string;
};

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

const baseStyle: CSSProperties = {
  color: 'var(--foreground-muted)',
  lineHeight: 1.7,
};

export function RichText({ content, className }: RichTextProps) {
  if (!content?.trim()) {
    return null;
  }

  if (looksLikeHtml(content)) {
    return <div className={className} style={baseStyle} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className={className} style={baseStyle}>
      {content.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph} style={{ marginTop: 0, marginBottom: 16, whiteSpace: 'pre-line' }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
