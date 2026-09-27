export const ONBOARDING_SECTIONS = [
  "Project Overview",
  "Technology Stack",
  "Architecture Overview",
  "Repository Structure",
  "Entry Points",
  "Core Modules",
  "Dependency Overview",
  "Application Flow",
  "Developer Setup",
  "Important Files",
  "Potential Risks / Areas to Understand",
  "Recommended Reading Order",
]

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

// Matches a heading line regardless of how the model formatted it:
// "1. Project Overview", "### Project Overview", "**Project Overview**", etc.
function buildHeadingPattern(title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `^\\s*[#>\\-*]{0,4}\\s*\\d{0,2}[.):]?\\s*\\**${escaped}\\**\\s*:?\\s*$`,
    "i",
  )
}

const headingPatterns = ONBOARDING_SECTIONS.map((title) => ({
  title,
  pattern: buildHeadingPattern(title),
}))

export function parseGuideIntoSections(guideText) {
  if (!guideText) return []

  const lines = guideText.split("\n")
  const sections = []
  let current = null

  for (const line of lines) {
    const match = headingPatterns.find(({ pattern }) => pattern.test(line))

    if (match) {
      current = { id: slugify(match.title), title: match.title, lines: [] }
      sections.push(current)
      continue
    }

    if (!current) {
      current = { id: "overview", title: "Overview", lines: [] }
      sections.push(current)
    }

    current.lines.push(line)
  }

  return sections.filter((section) => section.lines.some((l) => l.trim().length > 0))
}

// A path-shaped token: has a slash and a dot-extension, or is a bare
// well-known config filename. Used only to give paths a distinct visual
// treatment - it does not validate anything.
const PATH_PATTERN = /\b[\w.-]+(?:\/[\w.-]+)+\.\w+\b|\b(package\.json|README\.md|requirements\.txt)\b/g

function renderInline(text, keyPrefix) {
  const boldSplit = text.split(/(\*\*[^*]+\*\*)/g)

  return boldSplit.map((chunk, i) => {
    const boldMatch = chunk.match(/^\*\*([^*]+)\*\*$/)
    const content = boldMatch ? boldMatch[1] : chunk

    const pieces = []
    let lastIndex = 0
    let m
    const re = new RegExp(PATH_PATTERN)

    while ((m = re.exec(content)) !== null) {
      if (m.index > lastIndex) pieces.push(content.slice(lastIndex, m.index))
      pieces.push(
        <code
          key={`${keyPrefix}-${i}-${m.index}`}
          className="rounded-none border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-[var(--font-mono)] text-[0.85em] text-zinc-300"
        >
          {m[0]}
        </code>,
      )
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < content.length) pieces.push(content.slice(lastIndex))

    return boldMatch ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-zinc-200">
        {pieces}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{pieces}</span>
    )
  })
}

export function GuideSectionBody({ lines }) {
  const blocks = []
  let listBuffer = []

  const flushList = (key) => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`list-${key}`} className="my-3 space-y-2">
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 text-[15px] leading-7 text-zinc-400"
          >
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
            <span>{renderInline(item, `li-${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()

    if (line === "") {
      flushList(index)
      return
    }

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/) || line.match(/^\d+[.)]\s+(.*)$/)

    if (bulletMatch) {
      listBuffer.push(bulletMatch[1])
      return
    }

    flushList(index)

    const subheadingMatch = line.match(/^\*\*([^*]+)\*\*:?$/)

    if (subheadingMatch) {
      blocks.push(
        <h4
          key={`h-${index}`}
          className="mt-6 mb-2 text-sm font-medium text-zinc-200"
        >
          {subheadingMatch[1]}
        </h4>,
      )
      return
    }

    blocks.push(
      <p key={`p-${index}`} className="my-3 text-[15px] leading-7 text-zinc-400">
        {renderInline(line, `p-${index}`)}
      </p>,
    )
  })

  flushList("end")

  return <div>{blocks}</div>
}