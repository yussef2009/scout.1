import React from "react"

export type StreamTab = "all" | "reels" | "news"

export interface ExploreStreamTabsProps {
  activeTab: StreamTab
  onSelectTab: (tab: StreamTab) => void
  counts: {
    all: number
    reels: number
    news: number
  }
}

interface TabConfig {
  id: StreamTab
  label: string
  icon: React.ReactNode
}

export function ExploreStreamTabs({
  activeTab,
  onSelectTab,
  counts,
}: ExploreStreamTabsProps) {
  const tabs: TabConfig[] = [
    {
      id: "all",
      label: "All",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "reels",
      label: "Reels",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: "news",
      label: "News",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="feed-stream-tabs"
      role="tablist"
      aria-label="Feed stream filter"
      data-testid="explore-stream-tabs"
    >
      <style>{`
        .feed-stream-tabs {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(14, 16, 22, 0.75) 100%);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 4px;
          width: fit-content;
          box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18),
                      inset 0 -1px 0 0 rgba(0, 0, 0, 0.4),
                      0 8px 24px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        @keyframes stream-glass-sweep {
          0% { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
          15% { opacity: 0.5; }
          35% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
          100% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
        }
        .feed-stream-tabs::before {
          content: "";
          position: absolute;
          inset: 0;
          width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08) 50%, transparent);
          pointer-events: none;
          animation: stream-glass-sweep 8s infinite ease-in-out;
        }
        .stream-tab-btn {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 6px 13px;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--gray, #9ca3af);
          cursor: pointer;
          transition: filter 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.2s ease,
                      background 0.25s ease;
          outline: none;
          will-change: filter, opacity, transform;
        }
        .feed-stream-tabs:hover .stream-tab-btn:not(:hover) {
          filter: blur(1.5px);
          opacity: 0.48;
          transform: scale(0.96);
        }
        .stream-tab-btn:hover {
          color: var(--white, #ffffff);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          filter: blur(0px) !important;
          opacity: 1 !important;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .stream-tab-btn.active {
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
          color: #0a0a0c;
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 0 14px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .stream-tab-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .stream-tab-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .stream-count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.08);
          color: var(--gray, #9ca3af);
          transition: all 0.15s ease;
        }
        .stream-tab-btn.active .stream-count-pill {
          background: rgba(0, 0, 0, 0.3);
          color: #0a0a0c;
        }
        .stream-tab-btn:focus-visible {
          outline: 2px solid #fbbf24;
          outline-offset: 1px;
        }
      `}</style>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const count = counts[tab.id] ?? 0
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`stream-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`stream-panel-${tab.id}`}
            aria-label={tab.label}
            className={`stream-tab-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelectTab(tab.id)}
            data-testid={`stream-tab-${tab.id}`}
            title={`${tab.label} (${count})`}
          >
            <span className="stream-tab-icon">{tab.icon}</span>
            <span className="stream-tab-label">{tab.label}</span>
            <span
              className="stream-count-pill stream-count-badge"
              data-testid={`stream-count-${tab.id}`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ExploreStreamTabs
