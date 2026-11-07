/* Paste into your project — works with zero setup */
/* ================================
   Search Expand — uimotion.fyi
   ================================ */

import React, { useState, useRef, useEffect } from "react"

export interface SearchExpandProps {
  placeholder?: string
  onSearch?: (term: string) => void
  onOpenModal?: (initialTerm?: string) => void
  onCloseModal?: () => void
  className?: string
  autoCloseOnBlur?: boolean
  initialQuery?: string
  isModalOpen?: boolean
}

export function SearchExpand({
  placeholder = "Search...",
  onSearch,
  onOpenModal,
  onCloseModal,
  className = "",
  autoCloseOnBlur = true,
  initialQuery = "",
  isModalOpen = false,
}: SearchExpandProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initialQuery)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialQuery !== undefined) {
      setValue(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    if (isModalOpen && !open) {
      setOpen(true)
    }
  }, [isModalOpen, open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        autoCloseOnBlur &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (!value.trim()) {
          setOpen(false)
          if (onCloseModal) onCloseModal()
        }
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, value, autoCloseOnBlur, onCloseModal])

  const handleToggle = () => {
    if (open && value.trim()) {
      if (onSearch) onSearch(value.trim())
      if (onOpenModal) onOpenModal(value.trim())
    } else {
      const next = !open
      setOpen(next)
      if (next && onOpenModal) {
        onOpenModal(value)
      } else if (!next && onCloseModal) {
        onCloseModal()
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    if (onSearch) onSearch(val)
    if (onOpenModal) onOpenModal(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (onSearch) onSearch(value.trim())
      if (onOpenModal) onOpenModal(value.trim())
    } else if (e.key === "Escape") {
      setOpen(false)
      if (onCloseModal) onCloseModal()
      inputRef.current?.blur()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`search-wrap ${open ? "open" : ""} ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        width: open ? 240 : 36,
        height: 36,
        overflow: "hidden",
        background: open
          ? "linear-gradient(135deg, rgba(26, 30, 46, 0.95), rgba(13, 16, 27, 0.98))"
          : "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: open
          ? "1px solid rgba(251, 191, 36, 0.65)"
          : "1px solid rgba(255, 255, 255, 0.16)",
        borderRadius: 999,
        padding: "0 9px",
        transition: "width 260ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease, box-shadow 200ms ease, background 200ms ease",
        boxShadow: open
          ? "0 0 20px rgba(251, 191, 36, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        boxSizing: "border-box",
      }}
      data-testid="search-expand-wrap"
    >
      <button
        type="button"
        className="search-icon"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: open ? "#fbbf24" : "rgba(255, 255, 255, 0.8)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          width: 18,
          height: 18,
          transition: "color 200ms ease, transform 200ms ease",
          transform: open ? "scale(1.05)" : "scale(1)",
        }}
        onClick={handleToggle}
        aria-label="Search"
        title="Search"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <input
        ref={inputRef}
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{
          background: "none",
          border: "none",
          outline: "none",
          color: "#ffffff",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 500,
          marginLeft: 8,
          width: open ? "100%" : 0,
          opacity: open ? 1 : 0,
          transition: "opacity 200ms ease 60ms",
          minWidth: 0,
        }}
      />
      {open && value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setValue("")
            if (onSearch) onSearch("")
            inputRef.current?.focus()
          }}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            fontSize: 12,
            padding: "0 4px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Clear search"
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchExpand
