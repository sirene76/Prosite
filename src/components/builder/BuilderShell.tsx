"use client";
import Link from "next/link";
import InspectorPanel from "./InspectorPanel";

export default function BuilderShell({ websiteId, children }: any) {
  return (
    <div className="builder-ui">
      <header className="top-nav">
        <div className="left-nav">
          <div className="logo">Prosite</div>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href={`/builder/${websiteId}`} className="nav-link active">
            Builder
          </Link>
        </div>
        <div className="right-nav">
          <span className="user">Hello, email@gmail.com</span>
          <button className="btn-primary">Sign out</button>
        </div>
      </header>

      <div className="builder-container">
        <main className="main">{children}</main>
        <aside className="inspector">
          <InspectorPanel />
        </aside>
      </div>
    </div>
  );
}
