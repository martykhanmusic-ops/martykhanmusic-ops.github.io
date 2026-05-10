import Goals from '../components/Goals';
import Hero from '../components/Hero';
import Loverboy from '../components/Loverboy';

export default function Home() {
  return (
    <>
      <Hero />
      <Goals />
      <div className="color-bar" />
      <Loverboy />
      <footer>&copy; 2025 Marty Khan Music. All rights reserved.</footer>
    </>
  );
}
