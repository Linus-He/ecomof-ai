const CONVERTED_ATTRIBUTES = ["aria-label", "placeholder", "title"]

function isIgnored(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
  return Boolean(element?.closest?.(".ignore-opencc"))
}

export async function observeTraditionalChinese(root: HTMLElement) {
  const { default: OpenCC } = await import("opencc-js/cn2t")
  const convertToTraditional = OpenCC.Converter({ from: "cn", to: "tw" })
  const originalText = new Map<Text, string>()
  const originalAttributes = new Map<Element, Map<string, string>>()

  const convertTextNode = (node: Text) => {
    const current = node.nodeValue || ""
    if (!current.trim() || isIgnored(node)) return

    const previousSource = originalText.get(node)
    const previousResult = previousSource == null ? null : convertToTraditional(previousSource)
    const source = previousSource == null || (current !== previousSource && current !== previousResult)
      ? current
      : previousSource

    originalText.set(node, source)
    const next = convertToTraditional(source)
    if (next !== current) node.nodeValue = next
  }

  const convertAttributes = (element: Element) => {
    if (isIgnored(element)) return
    const originals = originalAttributes.get(element) || new Map<string, string>()

    CONVERTED_ATTRIBUTES.forEach(attribute => {
      if (!element.hasAttribute(attribute)) return
      const current = element.getAttribute(attribute) || ""
      const previousSource = originals.get(attribute)
      const previousResult = previousSource == null ? null : convertToTraditional(previousSource)
      const source = previousSource == null || (current !== previousSource && current !== previousResult)
        ? current
        : previousSource

      originals.set(attribute, source)
      const next = convertToTraditional(source)
      if (next !== current) element.setAttribute(attribute, next)
    })

    if (originals.size) originalAttributes.set(element, originals)
  }

  const convertTree = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      convertTextNode(node as Text)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE || isIgnored(node)) return

    convertAttributes(node as Element)
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    let current = walker.nextNode()
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) convertTextNode(current as Text)
      else convertAttributes(current as Element)
      current = walker.nextNode()
    }
  }

  convertTree(root)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === "characterData") convertTextNode(mutation.target as Text)
      if (mutation.type === "attributes") convertAttributes(mutation.target as Element)
      mutation.addedNodes.forEach(convertTree)
    })
  })

  observer.observe(root, {
    attributeFilter: CONVERTED_ATTRIBUTES,
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  })

  return () => {
    observer.disconnect()
    originalText.forEach((source, node) => {
      if (node.isConnected) node.nodeValue = source
    })
    originalAttributes.forEach((attributes, element) => {
      if (!element.isConnected) return
      attributes.forEach((source, attribute) => element.setAttribute(attribute, source))
    })
  }
}
