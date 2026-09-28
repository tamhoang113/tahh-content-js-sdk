type JsonContentViewerProps = {
  content: unknown;
};

export default function JsonContentViewer({ content }: JsonContentViewerProps) {
  return (
    <div
      style={{
        margin: '1rem',
        padding: '1rem',
        background: '#1e1e1e',
        borderRadius: '8px',
        overflowX: 'auto',
      }}
    >
      <div style={{ marginBottom: '0.5rem', color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
        Content JSON
      </div>
      <pre
        style={{
          margin: 0,
          color: '#d4d4d4',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
