import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>bet-crm-demo</h1>
      <p>Admin UI placeholder.</p>

      <ul>
        <li>
          <Link href="/agents">Agents</Link>
        </li>
        <li>
          <Link href="/users">Users</Link>
        </li>
        <li>
          <Link href="/withdrawals">Withdrawals</Link>
        </li>
      </ul>
    </main>
  );
}
