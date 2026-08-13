// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import {
  NAVIGATION_DOMAINS,
  getNavigationItem,
  getNavigationLabel,
  getNavigationRoute,
} from "../../config/navigationRegistry"

const OVERVIEW_ITEM = getNavigationRoute("home")

function normalizeActiveHash(hash) {
  const normalized = String(hash || "").replace(/^#/, "").trim()
  return !normalized || normalized === "default" ? "overview" : normalized
}

export function PrimaryDomainNavigation({
  activeHash,
  activeTab,
  isMobile,
  lang,
  onNavigate,
  theme,
}) {
  const [openDomainId, setOpenDomainId] = useState(null)
  const rootRef = useRef(null)
  const railRef = useRef(null)
  const closeTimerRef = useRef(null)
  const currentHash = normalizeActiveHash(activeHash)
  const activeItem = getNavigationItem(currentHash)
  const activeRoute = getNavigationRoute(activeTab)
  const activeNavId = activeItem?.id === "home"
    ? "home"
    : activeItem?.domainId || activeRoute?.domainId || "home"
  const domains = useMemo(
    () => [...NAVIGATION_DOMAINS].sort((a, b) => a.order - b.order),
    [],
  )
  const openDomain = domains.find(domain => domain.id === openDomainId) || null

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const scheduleClose = () => {
    cancelScheduledClose()
    closeTimerRef.current = window.setTimeout(() => setOpenDomainId(null), 160)
  }

  const openMenu = (domainId) => {
    cancelScheduledClose()
    setOpenDomainId(domainId)
  }

  const toggleMenu = (domainId) => {
    cancelScheduledClose()
    setOpenDomainId(current => current === domainId ? null : domainId)
  }

  const navigate = (hash) => {
    setOpenDomainId(null)
    onNavigate(hash, { resetScroll: true })
  }

  useEffect(() => {
    const rail = railRef.current
    const activeButton = rail?.querySelector(`[data-nav-id="${activeNavId}"]`)
    if (!activeButton || !rail) return undefined

    const centerActiveItem = () => {
      if (!isMobile) return
      const left = activeButton.offsetLeft - (rail.clientWidth - activeButton.clientWidth) / 2
      rail.scrollTo?.({ left: Math.max(0, left), behavior: "auto" })
    }

    const frame = window.requestAnimationFrame(centerActiveItem)
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [activeNavId, isMobile])

  useEffect(() => {
    if (!openDomainId) return undefined
    const close = (event) => {
      if (event.key === "Escape") {
        const trigger = rootRef.current?.querySelector(`[data-nav-id="${openDomainId}"]`)
        setOpenDomainId(null)
        trigger?.focus()
        return
      }
      if (event.type === "pointerdown" && !rootRef.current?.contains(event.target)) {
        setOpenDomainId(null)
      }
    }
    window.addEventListener("keydown", close)
    window.addEventListener("pointerdown", close)
    return () => {
      window.removeEventListener("keydown", close)
      window.removeEventListener("pointerdown", close)
    }
  }, [openDomainId])

  useEffect(() => () => cancelScheduledClose(), [])

  return (
    <div
      className="primary-domain-navigation"
      data-menu-open={openDomain ? "true" : "false"}
      onPointerEnter={cancelScheduledClose}
      onPointerLeave={event => {
        if (!isMobile && event.pointerType === "mouse") scheduleClose()
      }}
      ref={rootRef}
      style={{
        "--nav-domain-accent": theme.accentText,
        "--nav-domain-bg": theme.panel,
        "--nav-domain-border": theme.border,
        "--nav-domain-divider": theme.divider,
        "--nav-domain-faint": theme.faint,
        "--nav-domain-subtle": theme.subtle,
        "--nav-domain-text": theme.textStrong,
      }}
    >
      <nav
        aria-label={lang === "zh" ? "主要导航" : "Primary navigation"}
        className="nav-primary-rail"
        data-lang={lang}
        data-testid="primary-nav-rail"
        ref={railRef}
      >
        <button
          aria-current={activeNavId === "home" ? "page" : undefined}
          className="nav-tab"
          data-active={activeNavId === "home" ? "true" : "false"}
          data-nav-id="home"
          onClick={() => navigate(OVERVIEW_ITEM.hash)}
          type="button"
        >
          <span className="nav-tab-label">{getNavigationLabel(OVERVIEW_ITEM, lang)}</span>
        </button>
        {domains.map(domain => {
          const active = activeNavId === domain.id
          const open = openDomainId === domain.id
          return (
            <button
              aria-controls={`nav-domain-panel-${domain.id}`}
              aria-expanded={open}
              aria-haspopup="menu"
              className="nav-tab nav-domain-trigger"
              data-active={active ? "true" : "false"}
              data-nav-id={domain.id}
              data-open={open ? "true" : "false"}
              key={domain.id}
              onClick={() => isMobile ? toggleMenu(domain.id) : openMenu(domain.id)}
              onKeyDown={event => {
                if (event.key !== "ArrowDown") return
                event.preventDefault()
                openMenu(domain.id)
                window.requestAnimationFrame(() => {
                  rootRef.current?.querySelector(`#nav-domain-panel-${domain.id} [role="menuitem"]`)?.focus()
                })
              }}
              onPointerEnter={event => {
                if (!isMobile && event.pointerType === "mouse") openMenu(domain.id)
              }}
              type="button"
            >
              <span className="nav-tab-label">{getNavigationLabel(domain, lang)}</span>
            </button>
          )
        })}
      </nav>

      {openDomain ? (
        <div
          aria-label={getNavigationLabel(openDomain, lang)}
          className="nav-domain-panel"
          data-domain-id={openDomain.id}
          id={`nav-domain-panel-${openDomain.id}`}
          role="menu"
        >
          <div className="nav-domain-panel-inner">
            {openDomain.groups.map((group, groupIndex) => (
              <section
                className="nav-domain-group"
                data-featured={groupIndex === 0 ? "true" : "false"}
                key={group.id}
              >
                <p>{getNavigationLabel(group, lang)}</p>
                <div>
                  {group.itemIds.map(itemId => {
                    const item = getNavigationItem(itemId)
                    if (!item) return null
                    const current = currentHash === item.hash || item.aliases?.includes(currentHash)
                    return (
                      <button
                        aria-current={current ? "page" : undefined}
                        className="nav-domain-item"
                        data-current={current ? "true" : "false"}
                        key={item.id}
                        onClick={() => navigate(item.hash)}
                        role="menuitem"
                        type="button"
                      >
                        <span>{getNavigationLabel(item, lang)}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
