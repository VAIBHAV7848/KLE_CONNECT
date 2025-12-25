declare module 'react-markdown' {
  import { FC, ReactNode } from 'react';

  export interface ReactMarkdownProps {
    children?: ReactNode;
  }

  const ReactMarkdown: FC<ReactMarkdownProps>;
  export default ReactMarkdown;
}
