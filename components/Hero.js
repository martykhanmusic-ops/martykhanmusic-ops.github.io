export default function Hero() {
  return (
    <header>
      <div className="background-decor" />
      <div className="circular-text">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id="circle" d="M50 50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0" />
          </defs>
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="#000">
            <textPath href="#circle">Marty Marty Marty Marty Marty Khan Khan Khan Khan Khan</textPath>
          </text>
        </svg>
      </div>
      <h1 className="hero-title">Marty Khan</h1>
      <nav className="cta-buttons" aria-label="Primary calls to action">
        <a href="#contact">Contact Us</a>
        <a href="#join">Join the Team</a>
        <a href="#tour">Tour Dates</a>
      </nav>
    </header>
  );
}
