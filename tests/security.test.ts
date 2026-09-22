import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
import { defaultDraft, draftSchema } from '../src/domain/studio'
import { defaultVisual, newLayer } from '../src/domain/composition'

test('business runtime records and WhatsApp secrets cannot be accessed through client SDKs', async () => {
  const alice = env.authenticatedContext('business-alice').firestore()
  const admin = env
    .authenticatedContext('business-admin', { admin: true })
    .firestore()
  const anonymous = env.unauthenticatedContext().firestore()
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'businesses/test-tenant'), {
      ownerId: 'business-alice',
      status: 'active',
    })
    await setDoc(
      doc(
        context.firestore(),
        'businesses/test-tenant/students/private-student',
      ),
      { name: 'Private record' },
    )
  })
  for (const client of [alice, admin, anonymous]) {
    await assertFails(getDoc(doc(client, 'businesses/test-tenant')))
    await assertFails(
      getDoc(doc(client, 'businesses/test-tenant/students/private-student')),
    )
    await assertFails(
      setDoc(doc(client, 'businesses/test-tenant/orders/forged'), {
        totalMinor: 1,
      }),
    )
    await assertFails(
      setDoc(doc(client, 'whatsappReceipts/forged'), {
        businessId: 'test-tenant',
      }),
    )
    await assertFails(
      setDoc(doc(client, 'businessQuotas/business-alice'), { count: 0 }),
    )
  }
})

test('full canvas saves are validated and only claimed admins can list clients', async () => {
  const alice = env.authenticatedContext('canvas-client').firestore()
  const bob = env.authenticatedContext('canvas-other').firestore()
  const admin = env
    .authenticatedContext('canvas-owner', { admin: true })
    .firestore()
  const impersonator = env
    .authenticatedContext('canvas-impostor', {
      email: 'elishaafari0@gmail.com',
      email_verified: true,
    })
    .firestore()
  const layers = Array.from({ length: 12 }, () => newLayer('rectangle', 'Home'))
  const draft = {
    ...defaultDraft(
      'industrial-plant-monitoring',
      'Plant design',
      ['Silos'],
      [],
    ),
    visual: defaultVisual,
    layers,
    userId: 'canvas-client',
    revision: 1,
    mediaPaths: Array.from(
      { length: 20 },
      (_, i) => `drafts/canvas-client/canvas/photo-${i}.png`,
    ),
    updatedAt: serverTimestamp(),
  }
  const path = 'users/canvas-client/drafts/canvas'
  const batch = writeBatch(alice)
  for (let i = 0; i < layers.length; i += 2) {
    batch.set(doc(alice, `${path}/layerGroups/${i / 2}`), {
      first: layers[i],
      second: layers[i + 1] || null,
    })
  }
  batch.set(doc(alice, path), draft)
  batch.set(doc(alice, `${path}/versions/1`), draft)
  await assertSucceeds(batch.commit())
  await assertFails(getDoc(doc(bob, path)))
  await assertFails(getDoc(doc(admin, path)))
  await assertFails(getDoc(doc(bob, `${path}/layerGroups/0`)))
  await assertFails(
    setDoc(doc(alice, `${path}/layerGroups/0`), {
      first: { ...layers[0], fill: 'url(https://evil.test)' },
      second: null,
    }),
  )
  await assertFails(
    setDoc(doc(alice, `${path}/layerGroups/0`), {
      first: { ...layers[0], opacity: 2 },
      second: null,
    }),
  )
  await assertFails(getDocs(collection(alice, 'users')))
  await assertFails(getDocs(collection(impersonator, 'users')))
  await assertSucceeds(getDocs(collection(admin, 'users')))
  await assertFails(
    updateDoc(doc(alice, path), {
      layers: [{ ...layers[0], opacity: 2 }],
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    updateDoc(doc(alice, path), {
      layers: [...layers, newLayer('text', 'Home')],
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    setDoc(doc(alice, 'projects/canvas-submission'), {
      ...project('canvas-client'),
      design: draftSchema.parse(draft),
      designDraftId: 'canvas',
    }),
  )
})

let env: RulesTestEnvironment
const storageEnabled = Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST)
const project = (uid: string) => ({
  userId: uid,
  clientName: uid,
  clientEmail: `${uid}@example.com`,
  title: 'School portal',
  projectType: 'School',
  description: 'A complete school website with admissions and parent access.',
  audience: 'Parents',
  budget: 500,
  timeline: 'Flexible',
  referenceLinks: [],
  assets: [],
  previews: [],
  status: 'Submitted',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-auraflow',
    firestore: {
      host: '127.0.0.1',
      port: 8780,
      rules: await readFile('firestore.rules', 'utf8'),
    },
    storage: storageEnabled
      ? {
          host: '127.0.0.1',
          port: 9798,
          rules: await readFile('storage.rules', 'utf8'),
        }
      : undefined,
  })
  await env.clearFirestore()
})
after(async () => {
  await env?.cleanup()
})

test('workflow decisions and their immutable events are tenant scoped and role restricted', async () => {
  const alice = env.authenticatedContext('flow-alice').firestore()
  const bob = env.authenticatedContext('flow-bob').firestore()
  const admin = env
    .authenticatedContext('flow-owner', { admin: true })
    .firestore()
  await setDoc(doc(alice, 'projects', 'flow-project'), project('flow-alice'))
  const base = {
    kind: 'review',
    title: 'Homepage version one',
    details: 'Review the first design',
    dueDate: '',
    assignedTo: 'client',
    url: 'https://example.com/v1',
    state: 'open',
    response: '',
    authorId: 'flow-owner',
    updatedBy: 'flow-owner',
    lastEventId: 'flow-event-1',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const event = {
    projectId: 'flow-project',
    userId: 'flow-alice',
    actorId: 'flow-owner',
    entityId: 'review-1',
    kind: 'review',
    title: base.title,
    state: 'open',
    createdAt: serverTimestamp(),
  }
  const batch = writeBatch(admin)
  batch.set(doc(admin, 'projects/flow-project/workItems/review-1'), base)
  batch.set(doc(admin, 'projectEvents/flow-event-1'), event)
  await assertSucceeds(batch.commit())
  await assertFails(
    getDoc(doc(bob, 'projects/flow-project/workItems/review-1')),
  )
  await assertFails(getDoc(doc(bob, 'projectEvents/flow-event-1')))
  await assertFails(getDocs(collection(alice, 'projectEvents')))
  await assertSucceeds(
    getDocs(
      query(
        collection(alice, 'projectEvents'),
        where('userId', '==', 'flow-alice'),
      ),
    ),
  )
  await assertFails(
    updateDoc(doc(alice, 'projects/flow-project/workItems/review-1'), {
      url: 'https://example.com/changed',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    updateDoc(doc(alice, 'projectEvents/flow-event-1'), {
      title: 'Forged update',
    }),
  )
  await assertFails(
    setDoc(doc(alice, 'projectEvents/forged-event'), {
      ...event,
      actorId: 'flow-alice',
      userId: 'flow-bob',
    }),
  )
  const approve = (db: typeof alice, uid: string, eventId: string) => {
    const b = writeBatch(db)
    b.update(doc(db, 'projects/flow-project/workItems/review-1'), {
      state: 'approved',
      response: 'Ready to build',
      updatedBy: uid,
      lastEventId: eventId,
      updatedAt: serverTimestamp(),
    })
    b.set(doc(db, 'projectEvents', eventId), {
      ...event,
      state: 'approved',
      actorId: uid,
    })
    return b.commit()
  }
  await assertFails(approve(admin, 'flow-owner', 'admin-approval'))
  await assertSucceeds(approve(alice, 'flow-alice', 'client-approval'))
  await assertFails(approve(alice, 'flow-alice', 'duplicate-approval'))
  await assertFails(
    updateDoc(doc(alice, 'projects/flow-project/workItems/review-1'), {
      state: 'open',
      updatedAt: serverTimestamp(),
    }),
  )
})

test('admin notes, priority, snippets, read markers, and checkpoint history stay private', async () => {
  const alice = env.authenticatedContext('private-alice').firestore()
  const bob = env.authenticatedContext('private-bob').firestore()
  const admin = env
    .authenticatedContext('private-owner', { admin: true })
    .firestore()
  await setDoc(doc(alice, 'projects/private-project'), project('private-alice'))
  const note = {
    text: 'Internal implementation estimate',
    authorId: 'private-owner',
    createdAt: serverTimestamp(),
  }
  await assertSucceeds(
    setDoc(doc(admin, 'projects/private-project/internalNotes/one'), note),
  )
  await assertFails(
    getDoc(doc(alice, 'projects/private-project/internalNotes/one')),
  )
  await assertFails(
    setDoc(doc(alice, 'projects/private-project/internalNotes/two'), {
      ...note,
      authorId: 'private-alice',
    }),
  )
  await assertSucceeds(
    setDoc(doc(admin, 'projectOps/private-project'), {
      priority: 'urgent',
      updatedBy: 'private-owner',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(getDoc(doc(alice, 'projectOps/private-project')))
  await assertFails(
    setDoc(doc(alice, 'projectOps/private-project'), {
      priority: 'normal',
      updatedBy: 'private-alice',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    setDoc(doc(admin, 'users/private-owner/snippets/one'), {
      title: 'Welcome',
      text: 'Welcome to your workspace.',
    }),
  )
  await assertFails(getDoc(doc(alice, 'users/private-owner/snippets/one')))
  await assertFails(
    setDoc(doc(alice, 'users/private-alice/snippets/one'), {
      title: 'Welcome',
      text: 'Welcome to your workspace.',
    }),
  )
  await assertSucceeds(
    setDoc(doc(alice, 'users/private-alice/eventReads/one'), {
      readAt: serverTimestamp(),
    }),
  )
  await assertFails(getDoc(doc(bob, 'users/private-alice/eventReads/one')))
  const draft = {
    ...defaultDraft('school', 'Checkpoint design', ['Admissions'], []),
    userId: 'private-alice',
    revision: 1,
    updatedAt: serverTimestamp(),
  }
  const save = writeBatch(alice)
  save.set(doc(alice, 'users/private-alice/drafts/checkpoint'), draft)
  save.set(
    doc(alice, 'users/private-alice/drafts/checkpoint/versions/1'),
    draft,
  )
  await assertSucceeds(save.commit())
  await assertFails(
    getDoc(doc(bob, 'users/private-alice/drafts/checkpoint/versions/1')),
  )
  await assertFails(
    updateDoc(doc(alice, 'users/private-alice/drafts/checkpoint/versions/1'), {
      name: 'Rewritten history',
    }),
  )
  await assertFails(
    setDoc(doc(alice, 'users/private-alice/drafts/checkpoint/versions/2'), {
      ...draft,
      revision: 2,
    }),
  )
})

test('bulk status batches record client-visible events within rule access limits', async () => {
  const admin = env
    .authenticatedContext('bulk-admin', { admin: true })
    .firestore()
  await env.withSecurityRulesDisabled(async (context) => {
    for (let i = 0; i < 5; i++)
      await setDoc(
        doc(context.firestore(), 'projects', `bulk-${i}`),
        project(`bulk-client-${i}`),
      )
  })
  const batch = writeBatch(admin)
  for (let i = 0; i < 5; i++) {
    batch.update(doc(admin, 'projects', `bulk-${i}`), {
      status: 'Discovery',
      updatedAt: serverTimestamp(),
      lastEventId: `bulk-event-${i}`,
    })
    batch.set(doc(admin, 'projectEvents', `bulk-event-${i}`), {
      projectId: `bulk-${i}`,
      userId: `bulk-client-${i}`,
      actorId: 'bulk-admin',
      entityId: `bulk-${i}`,
      kind: 'status',
      title: 'School portal',
      state: 'Discovery',
      createdAt: serverTimestamp(),
    })
  }
  await assertSucceeds(batch.commit())
})
test('project isolation, tenant-safe queries, and privileged status changes', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  const bob = env.authenticatedContext('bob').firestore()
  const admin = env.authenticatedContext('owner', { admin: true }).firestore()
  await assertSucceeds(
    setDoc(doc(alice, 'projects', 'alice-project'), project('alice')),
  )
  await assertSucceeds(getDoc(doc(alice, 'projects', 'alice-project')))
  await assertFails(getDoc(doc(bob, 'projects', 'alice-project')))
  await assertFails(getDocs(collection(bob, 'projects')))
  await assertSucceeds(
    getDocs(
      query(collection(alice, 'projects'), where('userId', '==', 'alice')),
    ),
  )
  await assertFails(
    setDoc(doc(bob, 'projects', 'forged-owner'), project('alice')),
  )
  await assertFails(
    updateDoc(doc(alice, 'projects', 'alice-project'), {
      status: 'Completed',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    updateDoc(doc(admin, 'projects', 'alice-project'), {
      status: 'Building',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    getDoc(
      doc(
        env.unauthenticatedContext().firestore(),
        'projects',
        'alice-project',
      ),
    ),
  )
})
test('drafts are owner-only and reject stale revisions', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  const bob = env.authenticatedContext('bob').firestore()
  const document = {
    ...defaultDraft('school', 'Adinkra Academy', ['Admissions'], ['Admin']),
    userId: 'alice',
    revision: 1,
    updatedAt: serverTimestamp(),
  }
  const location = doc(alice, 'users', 'alice', 'drafts', 'draft-1')
  await assertSucceeds(setDoc(location, document))
  await assertFails(
    updateDoc(location, {
      revision: 2,
      logoPath: 'drafts/bob/design-one/photo.png',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    updateDoc(location, {
      revision: 2,
      mediaPaths: ['drafts/bob/design-one/photo.png'],
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(getDoc(doc(bob, 'users', 'alice', 'drafts', 'draft-1')))
  await assertFails(
    updateDoc(location, {
      revision: 1,
      name: 'Stale write',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    updateDoc(location, {
      revision: 2,
      name: 'New version',
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    updateDoc(location, {
      revision: 3,
      mediaPaths: Array.from(
        { length: 20 },
        (_, i) => `drafts/alice/design-one/photo-${i}.png`,
      ),
      updatedAt: serverTimestamp(),
    }),
  )
  const design = draftSchema.parse((await getDoc(location)).data())
  await assertSucceeds(
    setDoc(doc(alice, 'projects', 'full-design'), {
      ...project('alice'),
      design,
      designDraftId: 'draft-1',
    }),
  )
  await assertFails(
    setDoc(doc(alice, 'projects', 'altered-design'), {
      ...project('alice'),
      design: { ...design, name: 'Forged snapshot' },
      designDraftId: 'draft-1',
    }),
  )
})
test('attachments cannot trick an admin into opening another client file', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  const location = doc(alice, 'projects', 'asset-project')
  await assertSucceeds(setDoc(location, project('alice')))
  const asset = {
    id: 'one',
    name: 'brief.txt',
    url: '',
    path: 'projects/bob/secret/references/brief.txt',
    kind: 'reference',
    uploadedBy: 'alice',
  }
  await assertFails(
    updateDoc(location, {
      assets: arrayUnion(asset),
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    updateDoc(location, {
      assets: arrayUnion({ ...asset, path: 'drafts/bob/secret/logo.png' }),
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    updateDoc(location, {
      assets: arrayUnion({
        ...asset,
        path: 'projects/alice/asset-project/references/brief.txt',
      }),
      updatedAt: serverTimestamp(),
    }),
  )
})
test('support works before a project exists and rejects impersonation', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  const bob = env.authenticatedContext('bob').firestore()
  await assertSucceeds(
    setDoc(doc(alice, 'conversations', 'alice'), {
      userId: 'alice',
      name: 'Alice',
      updatedAt: serverTimestamp(),
    }),
  )
  const message = {
    authorId: 'alice',
    authorName: 'Alice',
    role: 'client',
    text: 'Hello AuraFlow',
    createdAt: serverTimestamp(),
  }
  await assertSucceeds(
    setDoc(doc(alice, 'conversations', 'alice', 'messages', 'one'), message),
  )
  await assertFails(
    getDocs(collection(bob, 'conversations', 'alice', 'messages')),
  )
  await assertFails(
    setDoc(doc(alice, 'conversations', 'alice', 'messages', 'forged'), {
      ...message,
      role: 'admin',
    }),
  )
})
test('a profile cannot create admin claims or upgrade its plan', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  const profile = {
    uid: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
    plan: 'Starter',
    savedTemplates: [],
    projectCount: 0,
  }
  await assertFails(
    setDoc(doc(alice, 'users', 'alice'), { ...profile, admin: true }),
  )
  await assertFails(
    setDoc(doc(alice, 'users', 'alice'), { ...profile, plan: 'Enterprise' }),
  )
  await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile))
  await assertFails(
    updateDoc(doc(alice, 'users', 'alice'), { plan: 'Enterprise' }),
  )
})
test('AFC courses, learning progress, submissions, and certificates remain scoped', async () => {
  const alice = env.authenticatedContext('afc-alice').firestore()
  const bob = env.authenticatedContext('afc-bob').firestore()
  const admin = env.authenticatedContext('afc-owner', { admin: true }).firestore()
  const anonymous = env.unauthenticatedContext().firestore()
  const courseId = 'afc-free-course'
  const draftCourseId = 'afc-private-draft'
  const enrollmentId = `afc-alice_${courseId}`
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'afcCourses', courseId), {
      title: 'Frontend foundations',
      slug: courseId,
      summary: 'A practical course covering accessible interfaces and component systems.',
      category: 'Software development',
      level: 'Beginner',
      priceGhs: 0,
      instructorName: 'AuraFlow Class',
      coverImage: '',
      published: true,
      estimatedHours: 12,
      outcomes: ['Build a component'],
      lessons: [{ id: 'lesson-one', title: 'Foundations' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(context.firestore(), 'afcCourses', draftCourseId), {
      title: 'Private instructor draft',
      slug: draftCourseId,
      summary: 'An unpublished course draft that must not appear in the public catalog.',
      category: 'Software development',
      level: 'Beginner',
      priceGhs: 0,
      instructorName: 'AuraFlow Class',
      coverImage: '',
      published: false,
      estimatedHours: 4,
      outcomes: ['Private outcome'],
      lessons: [{ id: 'draft-lesson', title: 'Draft lesson' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await assertSucceeds(getDoc(doc(anonymous, 'afcCourses', courseId)))
  await assertSucceeds(
    getDocs(
      query(
        collection(anonymous, 'afcCourses'),
        where('published', '==', true),
      ),
    ),
  )
  await assertFails(getDoc(doc(anonymous, 'afcCourses', draftCourseId)))
  await assertSucceeds(getDoc(doc(alice, 'afcCourses', courseId)))
  await assertSucceeds(
    setDoc(doc(alice, 'afcEnrollments', enrollmentId), {
      userId: 'afc-alice',
      courseId,
      status: 'active',
      completedLessonIds: [],
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(
    setDoc(doc(bob, 'afcEnrollments', `afc-bob_${courseId}`), {
      userId: 'afc-alice',
      courseId,
      status: 'active',
      completedLessonIds: [],
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    updateDoc(doc(alice, 'afcEnrollments', enrollmentId), {
      completedLessonIds: ['lesson-one'],
      progress: 100,
      updatedAt: serverTimestamp(),
    }),
  )
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'afcAssessments', 'assessment-one'), {
      courseId,
      title: 'Interface assessment',
      durationMinutes: 20,
      passMark: 70,
      maxAttempts: 2,
      questionCount: 2,
      published: true,
    })
  })
  await assertSucceeds(getDoc(doc(alice, 'afcAssessments', 'assessment-one')))
  await assertFails(getDoc(doc(bob, 'afcAssessments', 'assessment-one')))
  await assertFails(
    setDoc(doc(alice, 'afcAssessmentAttempts', 'forged-attempt'), {
      userId: 'afc-alice', courseId, assessmentId: 'assessment-one', score: 100,
    }),
  )
  await assertFails(getDoc(doc(bob, 'afcEnrollments', enrollmentId)))
  await assertSucceeds(
    setDoc(doc(alice, 'afcSubmissions', 'alice-submission'), {
      userId: 'afc-alice',
      courseId,
      title: 'Interface review',
      response: 'I reviewed the interface hierarchy, keyboard flow, and responsive behaviour.',
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  )
  await assertFails(getDoc(doc(bob, 'afcSubmissions', 'alice-submission')))
  await assertFails(
    setDoc(doc(alice, 'afcCertificates', 'alice-certificate'), {
      userId: 'afc-alice',
      courseId,
      certificateCode: 'AFC-2026-ABCDE123',
      issuedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(
    setDoc(doc(admin, 'afcCertificates', 'alice-certificate'), {
      userId: 'afc-alice',
      courseId,
      certificateCode: 'AFC-2026-ABCDE123',
      issuedAt: serverTimestamp(),
    }),
  )
  await assertSucceeds(getDoc(doc(alice, 'afcCertificates', 'alice-certificate')))
})
test(
  'storage isolates clients and rejects executable image uploads',
  { skip: !storageEnabled },
  async () => {
    const alice = env.authenticatedContext('alice').storage()
    const bob = env.authenticatedContext('bob').storage()
    const path = 'drafts/alice/design-one/photo.png'
    await assertFails(
      uploadBytes(
        ref(alice, 'drafts/alice/design-one/empty.png'),
        new Uint8Array(),
        { contentType: 'image/png' },
      ),
    )
    await assertSucceeds(
      uploadBytes(ref(alice, path), new Uint8Array([137, 80, 78, 71]), {
        contentType: 'image/png',
      }),
    )
    await assertFails(getBytes(ref(bob, path)))
    await assertFails(
      uploadBytes(
        ref(alice, 'drafts/alice/design-one/attack.svg'),
        new TextEncoder().encode('<svg/>'),
        { contentType: 'image/svg+xml' },
      ),
    )
    await assertFails(
      uploadBytes(
        ref(alice, 'drafts/bob/design-one/file.png'),
        new Uint8Array([1]),
        { contentType: 'image/png' },
      ),
    )
  },
)
