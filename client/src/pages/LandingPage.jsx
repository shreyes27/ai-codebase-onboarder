import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Features from "../components/Features"

function LandingPage({ onAnalyze, onHome, onHowItWorks }) {
  return (
    <main className="min-h-screen bg-[color:var(--color-ink)] text-[color:var(--color-body)]">
      <Navbar
        onAnalyze={onAnalyze}
        onHome={onHome}
        onHowItWorks={onHowItWorks}
        currentPage="home"
      />

      <Hero onAnalyze={onAnalyze} />

      <Features />
    </main>
  )
}

export default LandingPage