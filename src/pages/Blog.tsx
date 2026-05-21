import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { useBlogPosts } from '../hooks/useFirebase'
import { IMAGES } from '../lib/images'

const categories = ['All', 'Dev Tips', 'Design', 'Business', 'AI & ML', 'Firebase', 'Mobile', 'Case Studies']
const pageSize = 4

export default function Blog() {
  const { data: posts } = useBlogPosts()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const matches = useMemo(
    () =>
      posts.filter((post) => {
        const filterCategory = category === 'All' || post.category === category || (category === 'Dev Tips' && post.category === 'Firebase')
        const terms = `${post.title} ${post.excerpt} ${post.category}`.toLowerCase()
        return filterCategory && terms.includes(search.toLowerCase())
      }),
    [category, posts, search],
  )
  const featured = posts[0]
  const gridMatches = matches.filter((post) => post.id !== featured?.id)
  const pageCount = Math.max(1, Math.ceil(gridMatches.length / pageSize))
  const visible = gridMatches.slice((page - 1) * pageSize, page * pageSize)

  return (
    <PageWrapper>
      <SEOHead title="Blog" description="AuraFlow notes on development, design, Firebase, mobile products, AI, business, and case studies." image={IMAGES.blog.default} />
      <section className="relative overflow-hidden py-20">
        <img src={IMAGES.blog.default} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-aura-dark/80" />
        <div className="section-shell relative">
          <Badge>Blog</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold sm:text-6xl">Build notes for digital teams that need to ship.</h1>
          <label className="relative mt-7 block max-w-xl">
            <span className="sr-only">Search posts</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search articles" className="bg-aura-dark/75 pl-9" />
          </label>
        </div>
      </section>

      <section className="section-shell py-14">
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <Button key={item} variant={category === item ? 'primary' : 'secondary'} className="shrink-0" onClick={() => { setCategory(item); setPage(1) }}>
              {item}
            </Button>
          ))}
        </div>

        {featured ? (
          <Card className="group mb-7 overflow-hidden">
            <Link to={`/blog/${featured.slug}`} className="grid lg:grid-cols-[1.1fr_1fr]">
              <img src={featured.coverImage} alt={featured.title} className="h-full min-h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="p-6 sm:p-8">
                <Badge>Featured - {featured.category}</Badge>
                <h2 className="mt-5 text-3xl font-extrabold">{featured.title}</h2>
                <p className="mt-4 leading-7 text-aura-muted">{featured.excerpt}</p>
                <p className="mt-5 text-sm text-aura-muted">
                  {format(new Date(featured.publishedAt), 'MMM d, yyyy')} - {featured.readTime}
                </p>
              </div>
            </Link>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((post) => (
            <Card key={post.id} className="group overflow-hidden">
              <Link to={`/blog/${post.slug}`} className="grid gap-0 sm:grid-cols-[220px_1fr]">
                <img loading="lazy" src={post.coverImage} alt={post.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-full" />
                <div className="p-5">
                  <Badge>{post.category}</Badge>
                  <h2 className="mt-4 text-2xl font-bold">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 text-aura-muted">{post.excerpt}</p>
                  <p className="mt-4 text-sm text-aura-muted">{post.readTime}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <span className="text-sm text-aura-muted">
            Page {page} of {pageCount}
          </span>
          <Button variant="secondary" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
            Next
          </Button>
        </div>
      </section>
    </PageWrapper>
  )
}
