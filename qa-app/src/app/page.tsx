export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>QA Test App</h1>
      <p>This app is used for JS SDK QA automation only.</p>
      <p>Content is rendered via <code>/[...slug]</code> routes.</p>
      <p>SDK API proxy: <code>POST /qa/apis/run</code></p>
    </main>
  );
}
