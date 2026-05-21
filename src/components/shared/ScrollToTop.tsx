import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    scrollPageToTop()
  }, [pathname])

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 400)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scrollPageToTop('smooth')}
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-lg bg-aura-gradient text-white shadow-aura"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 animate-bounce" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}

function scrollPageToTop(behavior?: ScrollBehavior) {
  if (typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior })
    return
  }

  document.scrollingElement?.scrollTo?.({ top: 0, behavior })
}
