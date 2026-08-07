'use client';

import { useRef } from 'react';
import ContentEditorBridge from './ContentEditorBridge';

export default function ContentEditorShell({
  children,
  engineDocument,
}: {
  children: React.ReactNode;
  engineDocument: Record<string, unknown>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <ContentEditorBridge rootRef={rootRef} mode="engine" engineDocument={engineDocument} />
      {children}
    </div>
  );
}

