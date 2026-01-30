import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-brand">HN → Action</div>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/weekly">Weekly</Link>
        <Link href="/tags/agents">Tags</Link>
        <a href="/api/feed" target="_blank" rel="noreferrer">
          JSON Feed
        </a>
        <Link href="/admin">Admin</Link>
      </div>
    </nav>
  );
}
