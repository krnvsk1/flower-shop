'use client'

export function StoreHero() {
  return (
    <section className="store-hero-wash relative min-h-[92vh] flex flex-col justify-end overflow-hidden px-5 sm:px-8 lg:px-12 pb-14 pt-28">
      <p className="absolute left-5 sm:left-8 lg:left-12 top-28 text-[10px] tracking-[0.42em] uppercase text-brass">
        Atelier · fresh cut
      </p>
      <p className="font-display italic absolute right-5 sm:right-10 top-[38%] text-foreground/12 text-[22vw] leading-none select-none pointer-events-none">
        fleur
      </p>
      <div className="relative max-w-none">
        <p className="text-[11px] tracking-[0.38em] uppercase text-muted-foreground mb-5">
          Доставка в день заказа
        </p>
        <h1 className="font-display font-medium text-[18vw] sm:text-[12vw] lg:text-[9.5rem] leading-[0.82] tracking-tight text-foreground">
          Букет
          <br />
          <span className="italic font-normal text-primary">как жест</span>
        </h1>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 max-w-5xl">
          <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Свежий срез, спокойные формы и композиции, которые не кричат. Собираем в ателье и привозим по городу.
          </p>
          <a
            href="#collection"
            className="text-[11px] tracking-[0.28em] uppercase text-foreground border-b border-foreground/40 pb-1 w-fit hover:border-primary hover:text-primary transition-colors"
          >
            Смотреть коллекцию
          </a>
        </div>
      </div>
    </section>
  )
}
