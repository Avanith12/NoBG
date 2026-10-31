import React, { useState, useEffect } from 'react'

interface ColorControlsProps {
  currentColor: string
  isTransparent: boolean
  onColorChange: (hex: string) => void
  onToggleTransparent: (transparent: boolean) => void
}

export const PRESET_COLORS = [
  { label: 'White', hex: '#FFFFFF', isLight: true },
  { label: 'Black', hex: '#000000', isLight: false },
  { label: 'Hot Pink', hex: '#FF2D95', isLight: false },
  { label: 'Slate', hex: '#64748B', isLight: false },
  { label: 'Electric Blue', hex: '#3B82F6', isLight: false },
  { label: 'Emerald', hex: '#10B981', isLight: false },
  { label: 'Amber', hex: '#F59E0B', isLight: false },
  { label: 'Violet', hex: '#8B5CF6', isLight: false },
]

export const ColorControls: React.FC<ColorControlsProps> = ({
  currentColor,
  isTransparent,
  onColorChange,
  onToggleTransparent,
}) => {
  const [hexInput, setHexInput] = useState(currentColor)
  const [isValidHex, setIsValidHex] = useState(true)

  // Sync internal input whenever external currentColor changes (e.g. preset clicked)
  useEffect(() => {
    setHexInput(currentColor)
    setIsValidHex(true)
  }, [currentColor])

  const normalizeHex = (input: string): string | null => {
    const cleaned = input.trim().replace(/^#/, '')
    if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      return `#${cleaned.toUpperCase()}`
    }
    if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
      const [r, g, b] = cleaned
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
    }
    return null
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim()
    if (raw && !raw.startsWith('#') && /^[0-9A-Fa-f]/.test(raw)) {
      raw = `#${raw}`
    }
    setHexInput(raw)

    const cleaned = raw.replace(/^#/, '')
    if (cleaned.length === 6) {
      const normalized = normalizeHex(raw)
      if (normalized) {
        setIsValidHex(true)
        onToggleTransparent(false)
        onColorChange(normalized)
        return
      }
    }

    setIsValidHex(raw === '' || raw === '#' || /^#[0-9A-Fa-f]{0,6}$/.test(raw))
  }

  const handleHexBlur = () => {
    const normalized = normalizeHex(hexInput)
    if (normalized) {
      setHexInput(normalized)
      setIsValidHex(true)
      onToggleTransparent(false)
      onColorChange(normalized)
    } else {
      // Revert to source-of-truth current color
      setHexInput(currentColor)
      setIsValidHex(true)
    }
  }

  const handlePresetClick = (hex: string) => {
    onToggleTransparent(false)
    onColorChange(hex)
    setHexInput(hex)
    setIsValidHex(true)
  }

  const handleTransparentClick = () => {
    onToggleTransparent(true)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white">Background Color</h3>
        <span className="text-xs text-muted">
          {isTransparent ? 'Transparent' : currentColor}
        </span>
      </div>

      {/* Required ID: color-presets */}
      <div id="color-presets" className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted">Presets</label>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
          {/* Transparent Preset */}
          <button
            type="button"
            onClick={handleTransparentClick}
            aria-label="Set background to transparent"
            aria-pressed={isTransparent}
            className={`group relative flex h-10 w-full items-center justify-center rounded-lg border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
              isTransparent
                ? 'border-pink ring-2 ring-pink/80 scale-105'
                : 'border-zinc-700 hover:border-zinc-500'
            } bg-checkers overflow-hidden`}
            title="Transparent background"
          >
            <span className="sr-only">Transparent</span>
            {isTransparent && (
              <span className="rounded bg-black/75 px-1 text-[10px] text-pink font-extrabold">✓</span>
            )}
          </button>

          {/* Color Presets (Includes #FFFFFF, #000000, #FF2D95) */}
          {PRESET_COLORS.map((preset) => {
            const isSelected = !isTransparent && currentColor.toUpperCase() === preset.hex.toUpperCase()
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handlePresetClick(preset.hex)}
                aria-label={`Preset ${preset.label} ${preset.hex}`}
                aria-pressed={isSelected}
                style={{ backgroundColor: preset.hex }}
                className={`group relative flex h-10 w-full items-center justify-center rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                  isSelected
                    ? 'border-pink ring-2 ring-pink scale-105'
                    : 'border-zinc-700/80 hover:border-zinc-400 hover:scale-102'
                }`}
                title={`${preset.label} (${preset.hex})`}
              >
                {isSelected && (
                  <span
                    className={`text-xs font-extrabold ${
                      preset.isLight ? 'text-black' : 'text-white'
                    }`}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Required ID: color-hex (HEX text field) */}
      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <label htmlFor="color-hex" className="text-xs font-medium text-muted">
            HEX Color
          </label>
          {!isValidHex && (
            <span className="text-xs font-medium text-amber-400">Invalid format (use #RRGGBB)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Visual Swatch with Native Color Picker trigger */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-700 focus-within:ring-2 focus-within:ring-pink">
            <div
              className={`h-full w-full ${isTransparent ? 'bg-checkers' : ''}`}
              style={{ backgroundColor: isTransparent ? undefined : currentColor }}
            />
            <input
              type="color"
              aria-label="Color picker swatch"
              value={currentColor}
              onChange={(e) => {
                const hex = e.target.value.toUpperCase()
                onToggleTransparent(false)
                onColorChange(hex)
                setHexInput(hex)
                setIsValidHex(true)
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              tabIndex={0}
            />
          </div>

          {/* HEX Input Field */}
          <div className="relative flex-1">
            <input
              id="color-hex"
              type="text"
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              value={hexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleHexBlur()
                }
              }}
              placeholder="#FF2D95"
              aria-label="HEX color value"
              aria-invalid={!isValidHex}
              className={`w-full rounded-lg border bg-zinc-900 py-2 px-3 font-mono text-sm uppercase text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                isValidHex ? 'border-zinc-700 focus:border-pink' : 'border-amber-500 bg-amber-950/20'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
