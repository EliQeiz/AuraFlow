import { useMemo, useState } from 'react'
import { templates } from '../data/templates'
import { pageBucket } from '../lib/utils'

export const styleOptions = ['Modern', 'Classic', 'Minimal', 'Bold', 'Luxury', 'Playful', 'Corporate']
export const colorOptions = ['Light', 'Dark', 'Colorful', 'Monochrome']
export const pageOptions = ['1-3', '5-7', '10+']
export const priceOptions = ['free', 'starter', 'pro', 'enterprise']

export function useTemplates() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [colorScheme, setColorScheme] = useState('')
  const [pages, setPages] = useState('')
  const [tier, setTier] = useState('')
  const [maxPrice, setMaxPrice] = useState(99)

  const results = useMemo(
    () =>
      templates.filter((template) => {
        const haystack = `${template.name} ${template.category} ${template.subcategory} ${template.tags.join(' ')}`.toLowerCase()
        const categoryMatch =
          !categories.length ||
          categories.some((category) => {
            const values = category.toLowerCase().split(/[/&]/)
            return values.some((value) => haystack.includes(value.trim().split(' ')[0]))
          })

        return (
          haystack.includes(search.toLowerCase()) &&
          categoryMatch &&
          (!style || template.style.toLowerCase().includes(style.toLowerCase())) &&
          (!colorScheme || template.colorScheme === colorScheme) &&
          (!pages || pageBucket(template.pages.length) === pages) &&
          (!tier || template.tier === tier) &&
          template.price <= maxPrice
        )
      }),
    [categories, colorScheme, maxPrice, pages, search, style, tier],
  )

  const toggleCategory = (category: string) =>
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    )

  const reset = () => {
    setSearch('')
    setCategories([])
    setStyle('')
    setColorScheme('')
    setPages('')
    setTier('')
    setMaxPrice(99)
  }

  return {
    categories,
    colorScheme,
    maxPrice,
    pages,
    reset,
    results,
    search,
    setColorScheme,
    setMaxPrice,
    setPages,
    setSearch,
    setStyle,
    setTier,
    style,
    tier,
    toggleCategory,
  }
}
