import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getFirebaseDb } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../ui/Input'
import { Button, ButtonLink } from '../ui/Button'
import { StatePanel } from '../ui/StatePanel'
import type { UserProfile } from '../../types'
export function AdminDirectory() {
  const { admin, user } = useAuth()
  const [search, setSearch] = useState('')
  const [email, setEmail] = useState('')
  const clients = useInfiniteQuery({
    queryKey: ['owner-client-directory', user?.uid, email],
    enabled: admin,
    initialPageParam: undefined as QueryDocumentSnapshot | undefined,
    queryFn: async ({ pageParam }) => {
      const constraints = [orderBy(documentId()), limit(30)]
      const snapshot = await getDocs(
        query(
          collection(getFirebaseDb(), 'users'),
          ...(email ? [where('email', '==', email)] : []),
          ...constraints,
          ...(pageParam ? [startAfter(pageParam)] : []),
        ),
      )
      return {
        rows: snapshot.docs.map(
          (item) => ({ ...item.data(), uid: item.id }) as UserProfile,
        ),
        next: snapshot.size === 30 ? snapshot.docs.at(-1) : undefined,
      }
    },
    getNextPageParam: (last) => last.next,
  })
  return (
    <section className="mt-6">
      <form
        className="library-toolbar directory-search"
        onSubmit={(e) => {
          e.preventDefault()
          setEmail(search.trim().toLowerCase())
        }}
      >
        <Input
          aria-label="Find client by email"
          placeholder="Exact client email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Find client
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSearch('')
            setEmail('')
          }}
        >
          All clients
        </Button>
      </form>
      {clients.isPending ? (
        <StatePanel loading />
      ) : clients.error ? (
        <StatePanel
          error={clients.error}
          retry={() => void clients.refetch()}
        />
      ) : (
        <>
          <div className="canvas-table-scroll">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Workspace plan</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {clients.data?.pages
                  .flatMap((p) => p.rows)
                  .map((client) => (
                    <tr key={client.uid}>
                      <td>{client.name}</td>
                      <td>{client.email}</td>
                      <td>{client.plan}</td>
                      <td>
                        <ButtonLink
                          variant="ghost"
                          to={`/dashboard/admin?client=${encodeURIComponent(client.uid)}`}
                        >
                          Client projects
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!clients.data?.pages[0].rows.length && (
            <StatePanel
              title="No matching client profiles"
              description="Profiles appear after customers sign in to their workspace."
            />
          )}
          {clients.hasNextPage && (
            <Button
              variant="secondary"
              loading={clients.isFetchingNextPage}
              onClick={() => void clients.fetchNextPage()}
            >
              Load more clients
            </Button>
          )}
        </>
      )}
    </section>
  )
}
