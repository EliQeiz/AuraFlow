import { suiteBlueprints } from './suiteBlueprints'
import type { IndustrySolution } from '../types'

export const industrySolutions: IndustrySolution[] = suiteBlueprints.map((suite) => ({
  id: suite.id.replace('suite-', 'solution-'),
  slug: suite.slug,
  title: suite.title,
  category: suite.category,
  summary: suite.summary,
  image: suite.image,
  audience: suite.audience,
  startingPrice: suite.startingPrice,
  platformLabel: suite.platformLabel,
  modules: suite.modules.map((module) => module.title),
  adminTools: suite.adminControls,
  workflows: suite.workflows.map((item) => item.title),
  roles: suite.roles.map((role) => role.title),
  recommendedTier: suite.startingPrice.includes('$39') || suite.startingPrice.includes('$59') || suite.startingPrice.includes('$69') ? 'Starter' : suite.startingPrice.includes('$129') ? 'Enterprise' : 'Growth',
}))

export const platformModes = [
  {
    id: 'managed-hosted',
    label: 'Low-cost hosted system',
    description: 'AuraFlow hosts the platform on a managed AuraFlow link and configures it for the business.',
  },
  {
    id: 'custom-build',
    label: 'Custom build',
    description: 'AuraFlow builds a dedicated application with deeper custom workflows, ownership, and integrations.',
  },
  {
    id: 'prototype-only',
    label: 'Prototype first',
    description: 'Design the full clickable direction now, then decide how much to build after review.',
  },
] as const

export const solutionCategories = ['All', ...Array.from(new Set(industrySolutions.map((solution) => solution.category)))]
