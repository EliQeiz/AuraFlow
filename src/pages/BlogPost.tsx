import { format } from 'date-fns'
import { Copy } from 'lucide-react'
import { FaLinkedin, FaWhatsapp, FaXTwitter } from 'react-icons/fa6'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { useBlogPosts } from '../hooks/useFirebase'

export default function BlogPost() {
  const { slug } = useParams()
  const { data: posts } = useBlogPosts()
  const post = posts.find((item) => item.slug === slug)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight
      setProgress(range > 0 ? (window.scrollY / range) * 100 : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const related = useMemo(() => posts.filter((item) => item.slug !== slug && item.category === post?.category).slice(0, 2), [post?.category, posts, slug])

  if (!post) return <Navigate to="/blog" replace />

  const pageUrl = window.location.href
  const shareText = encodeURIComponent(post.title)

  return (
    <PageWrapper>
      <SEOHead title={post.title} description={post.excerpt} image={post.coverImage} />
      <span className="fixed left-0 top-20 z-40 h-1 bg-aura-gradient" style={{ width: `${progress}%` }} />
      <section className="relative min-h-[60vh] overflow-hidden">
        <img src={post.coverImage} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-aura-dark via-aura-dark/72 to-aura-dark/35" />
        <div className="section-shell relative flex min-h-[60vh] flex-col justify-end py-12">
          <Badge className="w-fit">{post.category}</Badge>
          <h1 className="mt-4 max-w-5xl text-4xl font-extrabold sm:text-6xl">{post.title}</h1>
          <p className="mt-4 text-aura-muted">{format(new Date(post.publishedAt), 'MMMM d, yyyy')} - {post.readTime}</p>
        </div>
      </section>

      <article className="section-shell grid gap-8 py-14 lg:grid-cols-[minmax(0,760px)_1fr]">
        <div className="prose-aura">{renderBody(post.content)}</div>
        <aside className="grid h-fit gap-4 lg:sticky lg:top-28">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <img src={post.author.avatar} alt={post.author.name} className="h-14 w-14 rounded-md object-cover" />
              <div>
                <h2 className="text-lg font-bold">{post.author.name}</h2>
                <p className="text-sm text-aura-muted">{post.author.role}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold">Share</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <a target="_blank" rel="noreferrer" aria-label="Share on X" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(pageUrl)}`} className="rounded-md border border-white/10 p-2 text-white hover:text-cyan-100">
                <FaXTwitter className="h-4 w-4" />
              </a>
              <a target="_blank" rel="noreferrer" aria-label="Share on LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`} className="rounded-md border border-white/10 p-2 text-white hover:text-cyan-100">
                <FaLinkedin className="h-4 w-4" />
              </a>
              <a target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(pageUrl)}`} className="rounded-md border border-white/10 p-2 text-white hover:text-cyan-100">
                <FaWhatsapp className="h-4 w-4" />
              </a>
              <Button
                variant="secondary"
                aria-label="Copy link"
                className="min-h-0 p-2"
                onClick={() => navigator.clipboard.writeText(pageUrl).then(() => toast.success('Link copied.'))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </aside>
      </article>

      <section className="section-shell pb-20">
        <h2 className="text-3xl font-extrabold">Related Posts</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(related.length ? related : posts.filter((item) => item.slug !== slug).slice(0, 2)).map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <Link to={`/blog/${item.slug}`} className="grid sm:grid-cols-[180px_1fr]">
                <img src={item.coverImage} alt={item.title} className="h-52 w-full object-cover" />
                <div className="p-5">
                  <Badge>{item.category}</Badge>
                  <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}

function renderBody(content: string) {
  const chunks = content.split(/(```[\s\S]*?```)/g).filter(Boolean)

  return chunks.map((chunk, index) => {
    if (chunk.startsWith('```')) {
      return <pre key={index}><code>{chunk.replace(/```[a-z]*\n?|\n?```/g, '')}</code></pre>
    }

    return chunk
      .split('\n')
      .filter(Boolean)
      .map((line, lineIndex) =>
        line.startsWith('## ') ? (
          <h2 key={`${index}-${lineIndex}`}>{line.replace('## ', '')}</h2>
        ) : (
          <p key={`${index}-${lineIndex}`}>{line}</p>
        ),
      )
  })
}
