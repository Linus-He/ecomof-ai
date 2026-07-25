import "@testing-library/jest-dom/vitest"

class TestResizeObserver {
  private callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(element: Element) {
    this.callback([{
      target: element,
      contentRect: {
        width: 900,
        height: 390,
        top: 0,
        left: 0,
        right: 900,
        bottom: 390,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    }], this)
  }

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver
