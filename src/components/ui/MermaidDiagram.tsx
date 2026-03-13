import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let idCounter = 0;

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#6366F1',
    primaryTextColor: '#fff',
    primaryBorderColor: '#4F46E5',
    lineColor: '#94A3B8',
    secondaryColor: '#F1F5F9',
    tertiaryColor: '#F8FAFC',
    fontSize: '13px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
    nodeSpacing: 30,
    rankSpacing: 50,
  },
});

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd_${++idCounter}`;

    const render = async () => {
      if (!containerRef.current) return;
      try {
        setError(null);
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al renderizar');
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="text-destructive text-sm p-4 bg-destructive/5 rounded-lg border border-destructive/20">
        Error al renderizar diagrama: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: 'auto' }}
    />
  );
}
