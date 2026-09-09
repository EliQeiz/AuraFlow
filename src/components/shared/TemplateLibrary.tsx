import { ArrowUpRight, Bookmark, Check, Search } from 'lucide-react'
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { suiteBlueprints } from '../../data/suiteBlueprints'
import { templates } from '../../data/templates'
import { getFirebaseDb } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'
import { Input, Select } from '../ui/Input'
import { Button, ButtonLink } from '../ui/Button'
import { SuiteCover, TemplateCover } from './TemplateCover'
import { StatePanel } from '../ui/StatePanel'

export function TemplateLibrary({
  privateLibrary = false,
}: {
  privateLibrary?: boolean
}) {
  const [tab, setTab] = useState('Business suites')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [pending, setPending] = useState('')
  const [count, setCount] = useState(12)
  const { user, profile, refreshProfile } = useAuth()
  const isSuite = tab === 'Business suites'
  const entries = isSuite
    ? suiteBlueprints.map((suite) => ({
        id: suite.id,
        slug: suite.slug,
        name: suite.title,
        category: suite.category,
        image: suite.image,
        description: suite.summary,
      }))
    : templates.map((template) => ({
        id: template.id,
        slug: template.slug,
        name: template.name,
        category: template.category,
        image: template.previewImage,
        description: template.description,
      }))
  const filtered = entries.filter(
    (item) =>
      (!category || item.category === category) &&
      `${item.name} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (tab !== 'Saved' || profile?.savedTemplates?.includes(item.id)),
  )
  async function bookmark(id: string) {
    if (!user || !profile || pending) return
    setPending(id)
    try {
      await updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
        savedTemplates: profile?.savedTemplates?.includes(id)
          ? arrayRemove(id)
          : arrayUnion(id),
      })
      await refreshProfile()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending('')
    }
  }
  return (
    <>
      <div className="tab-bar" role="tablist" aria-label="Template collection">
        {[
          'Business suites',
          'Website templates',
          ...(privateLibrary ? ['Saved'] : []),
        ].map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => {
              setTab(value)
              setCategory('')
              setCount(12)
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Search templates"
            placeholder="Search the library..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCount(12)
            }}
          />
        </div>
        <Select
          aria-label="Template category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setCount(12)
          }}
        >
          <option value="">All industries</option>
          {[...new Set(entries.map((entry) => entry.category))]
            .sort()
            .map((value) => (
              <option key={value}>{value}</option>
            ))}
        </Select>
        <span className="text-xs text-aura-muted ml-auto">
          {filtered.length} results
        </span>
      </div>
      <div className="library-grid">
        {filtered.slice(0, count).map((item) => (
          <article className="library-item" key={item.id}>
            <div className="library-image">
              {isSuite ? (
                <SuiteCover
                  suite={suiteBlueprints.find((suite) => suite.id === item.id)!}
                />
              ) : (
                <TemplateCover
                  template={templates.find(
                    (template) => template.id === item.id,
                  )!}
                />
              )}
              {privateLibrary && !isSuite && (
                <button
                  className="icon-button"
                  aria-label={`${profile?.savedTemplates?.includes(item.id) ? 'Unsave' : 'Save'} ${item.name}`}
                  title={
                    !profile
                      ? 'Syncing your profile'
                      : profile.savedTemplates?.includes(item.id)
                        ? 'Unsave template'
                        : 'Save template'
                  }
                  disabled={!profile || Boolean(pending)}
                  aria-busy={pending === item.id}
                  onClick={() => void bookmark(item.id)}
                >
                  {profile?.savedTemplates?.includes(item.id) ? (
                    <Check />
                  ) : (
                    <Bookmark />
                  )}
                </button>
              )}
            </div>
            <h2>{item.name}</h2>
            <span className="library-category">
              {item.category} · {isSuite ? 'Business system' : 'Website'}
            </span>
            <p className="line-clamp-2">{item.description}</p>
            <div className="page-actions">
              <ButtonLink
                variant="secondary"
                to={`${isSuite ? '/solutions' : '/templates'}/${item.slug}`}
              >
                View template
                <ArrowUpRight />
              </ButtonLink>
              {privateLibrary && (
                <ButtonLink
                  to={
                    isSuite
                      ? `/dashboard/studio?suite=${item.slug}`
                      : `/dashboard/requests/new?template=${item.slug}`
                  }
                >
                  {isSuite ? 'Open in studio' : 'Use template'}
                </ButtonLink>
              )}
            </div>
          </article>
        ))}
      </div>
      {filtered.length > count && (
        <div className="library-more">
          <Button
            variant="secondary"
            onClick={() => setCount((value) => value + 12)}
          >
            Load more templates
          </Button>
          <span>
            {Math.min(count, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}
      {!filtered.length && (
        <StatePanel
          title="No templates found"
          description={
            tab === 'Saved'
              ? 'Bookmark a website template to keep it here.'
              : 'Try another search or industry.'
          }
        />
      )}
    </>
  )
}
