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
        background: "#1E1E1E",
        border: "1px solid #333",
        borderRadius: 999,
        padding: "0 8px",
        transition: "width 260ms ease-in-out",
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
          fontSize: 14,
          cursor: "pointer",
          color: "#888",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        onClick={handleToggle}
        aria-label="Search"
        title="Search"
      >
        🔍
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
          color: "white",
          fontSize: 14,
          marginLeft: 8,
          width: open ? "100%" : 0,
          opacity: open ? 1 : 0,
          transition: "opacity 200ms ease 60ms",
          minWidth: 0,
        }}
      />
    </div>
  )
}

export default SearchExpand
