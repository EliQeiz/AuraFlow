import {
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  Code2,
  Database,
  Globe,
  Headphones,
  Layers3,
  Palette,
  Search,
  ServerCog,
  ShoppingBag,
  Smartphone,
} from 'lucide-react'

const icons = {
  globe: Globe,
  code: Code2,
  smartphone: Smartphone,
  chart: ChartNoAxesColumnIncreasing,
  brain: BrainCircuit,
  palette: Palette,
  database: Database,
  search: Search,
  'shopping-bag': ShoppingBag,
  headphones: Headphones,
  server: ServerCog,
  layers: Layers3,
}

export function ServiceIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? Globe
  return <Icon className={className} />
}
