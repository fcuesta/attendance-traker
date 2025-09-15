'use client'
import * as React from 'react'

type Option = { label: string; value: string; color: string }

export function SelectStatus({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  label?: string
  value?: string
  onChange: (v: string) => void
  options: Option[]
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
      <select
        className={`${options.find(opt => opt.value === value)?.color ?? 'bg-white dark:bg-gray-800'} w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled className="bg-white dark:bg-gray-800">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className={opt.color}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
