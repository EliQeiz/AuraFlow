import { FaWhatsapp } from 'react-icons/fa'
import { Tooltip } from '../ui/Tooltip'

export function WhatsAppButton() {
  return (
    <Tooltip text="Chat with AuraFlow">
      <a
        className="fixed bottom-20 right-5 z-40 grid h-12 w-12 animate-pulse-slow place-items-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
        href="https://wa.me/233506624529"
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp chat"
      >
        <FaWhatsapp className="h-6 w-6" />
      </a>
    </Tooltip>
  )
}
