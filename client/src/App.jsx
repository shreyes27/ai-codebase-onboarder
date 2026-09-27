import { useState } from "react"

import LandingPage from "./pages/LandingPage"
import RepositoryPage from "./pages/RepositoryPage"
import HowItWorksPage from "./pages/HowItWorksPage"

function App() {
  const [page, setPage] = useState("landing")

  if (page === "repository") {
    return <RepositoryPage onBack={() => setPage("landing")} />
  }

  if (page === "how-it-works") {
    return (
      <HowItWorksPage
        onHome={() => setPage("landing")}
        onAnalyze={() => setPage("repository")}
      />
    )
  }

  return (
    <LandingPage
      onAnalyze={() => setPage("repository")}
      onHome={() => setPage("landing")}
      onHowItWorks={() => setPage("how-it-works")}
    />
  )
}

export default App