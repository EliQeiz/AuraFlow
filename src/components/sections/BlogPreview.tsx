import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { seedPosts } from '../../data/blog'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function BlogPreview() {
  return (
    <section className="section-shell py-20">
      <h2 className="text-3xl font-extrabold sm:text-5xl">Latest Thinking</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {seedPosts.slice(0, 3).map((post) => (
          <Card key={post.id} className="group overflow-hidden">
            <Link to={`/blog/${post.slug}`}>
              <div className="aspect-[16/10] overflow-hidden">
                <img loading="lazy" alt={post.title} src={post.coverImage} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{post.category}</Badge>
                  <span className="text-sm text-aura-muted">{post.readTime}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-aura-muted">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-100">
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
