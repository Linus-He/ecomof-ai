import { describe, expect, it } from "vitest"
import { interfaceText } from "../../utils/interfaceLocale"
import { editorialLocales } from "../../data/editorialLocales"

describe("new language interface coverage", () => {
  it.each(["ja", "ko", "es"])("localizes %s core controls and editorial content", locale => {
    for (const label of ["What can I help with?", "Latest updates", "Latest research", "Methods & validation", "Surface area", "Search languages"]) {
      expect(interfaceText(locale, label)).not.toBe(label)
    }
    const content = editorialLocales[locale as keyof typeof editorialLocales]
    expect(content.stories).toHaveLength(3)
    expect(content.research).toHaveLength(3)
    content.stories.forEach(story => {
      expect(story.sections).toHaveLength(3)
      expect(story.comparison).toHaveLength(3)
    })
  })
  it("keeps unknown scientific terminology rather than inventing translations", () => {
    expect(interfaceText("ja", "UiO-66")).toBe("UiO-66")
    expect(interfaceText("zh-HK", "Research", "研究")).toBe("研究")
  })
})
