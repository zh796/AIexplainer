import { describe, it, expect } from "vitest"
import { StreamParser } from "./streamParser"

describe("StreamParser", () => {
  it("should parse a text page", () => {
    const pages: any[] = []
    const parser = new StreamParser((p) => pages.push(p))

    parser.feed('{"pageType":"text","content":"Hello World"}\n')
    parser.flush()

    expect(pages).toHaveLength(1)
    expect(pages[0].pageType).toBe("text")
    expect(pages[0].content).toBe("Hello World")
  })

  it("should handle partial chunks", () => {
    const pages: any[] = []
    const parser = new StreamParser((p) => pages.push(p))

    parser.feed('{"pageType":"text",')
    parser.feed('"content":"Partial test"}\n')
    parser.flush()

    expect(pages).toHaveLength(1)
    expect(pages[0].content).toBe("Partial test")
  })

  it("should handle multiple pages", () => {
    const pages: any[] = []
    const parser = new StreamParser((p) => pages.push(p))

    parser.feed('{"pageType":"text","content":"Page 1"}\n')
    parser.feed('{"pageType":"code","content":"console.log(1)","language":"js"}\n')
    parser.flush()

    expect(pages).toHaveLength(2)
    expect(pages[0].pageType).toBe("text")
    expect(pages[1].pageType).toBe("code")
  })

  it("should handle invalid JSON gracefully", () => {
    const pages: any[] = []
    const parser = new StreamParser((p) => pages.push(p))

    parser.feed("not json at all\n")
    parser.feed('{"pageType":"text","content":"Valid"}\n')
    parser.flush()

    expect(pages).toHaveLength(1)
    expect(pages[0].content).toBe("Valid")
  })
})