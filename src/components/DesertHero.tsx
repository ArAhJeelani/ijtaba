import type { PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

function moveAtmosphere(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

  const hero = event.currentTarget;
  const bounds = hero.getBoundingClientRect();
  hero.style.setProperty("--breeze-x", `${(event.clientX - bounds.left - bounds.width / 2) / bounds.width * 12}px`);
  hero.style.setProperty("--breeze-y", `${(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 8}px`);
}

export function DesertHero() {
  return (
    <section
      className="desert-hero"
      aria-labelledby="desert-hero-title"
      onPointerMove={moveAtmosphere}
      onPointerLeave={({ currentTarget }) => {
        currentTarget.style.removeProperty("--breeze-x");
        currentTarget.style.removeProperty("--breeze-y");
      }}
    >
      <div className="desert-scene">
        <img
          className="desert-hero-art"
          src="/assets/desert-dua-hero-prayer-mat.png"
          alt="Footprints lead to a prayer mat in moonlit desert dunes, with a masjid in the distance."
          width={1672}
          height={941}
          fetchPriority="high"
        />
        <div className="desert-light-map" aria-hidden="true">
          <div className="desert-night-light">
            <i className="desert-moonlight" />
            <i className="desert-star" />
            <i className="desert-star" />
            <i className="desert-star" />
            <i className="desert-star" />
          </div>
          <i className="desert-sand-haze" />
          <i className="desert-trail-light" />
        </div>
      </div>
      <div className="desert-hero-copy">
        <h1 id="desert-hero-title"><span>One Dua</span>{" "}<em>Away</em></h1>
        <Link className="desert-hero-cta" to="/discover">
          Explore Du’as <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
