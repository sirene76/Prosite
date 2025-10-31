"use client";

export default function NewBuilderShell({ children }: any) {
  return (
    <div className="builder-container">
      <header className="top-nav">
        <div className="left-nav">
          <div className="logo">Prosite</div>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="#" className="nav-link active">Builder</a>
        </div>
        {/* <div className="right-nav">
          <span className="user">Hello, email@gmail.com</span>
          <button className="btn-primary">Sign out</button>
        </div> */}
      </header>

      {/* ✅ Added this wrapper */}
      <div className="builder-body">
        {children}
      </div>
    </div>
  );
}
