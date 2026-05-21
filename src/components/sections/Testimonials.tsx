import { Star } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { testimonials } from '../../data/testimonials'
import { Card } from '../ui/Card'

export function Testimonials() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-aura-surface/60 py-20">
      <span className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 animate-glow rounded-full bg-aura-violet/20 blur-3xl" />
      <div className="section-shell relative">
        <h2 className="text-3xl font-extrabold sm:text-5xl">Client Notes</h2>
        <Swiper className="mt-8" spaceBetween={16} slidesPerView={1.05} breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}>
          {testimonials.slice(0, 6).map((review) => (
            <SwiperSlide key={review.id} className="h-auto">
              <Card tilt className="h-full p-5">
                <div className="flex items-center gap-3">
                  <img loading="lazy" className="h-12 w-12 rounded-md object-cover" alt={review.name} src={review.avatar} />
                  <div>
                    <h3 className="font-bold">{review.name}</h3>
                    <p className="text-sm text-aura-muted">
                      {review.role}, {review.company}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1 text-amber-200">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 leading-7 text-aura-muted">{review.quote}</p>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
