import { Link, useLocation } from "react-router-dom";
import "./dua-profiles.css";

export function DiscoverSections() {
  const { pathname, search } = useLocation();
  const links = [
    ["/discover/uplifters", "Uplifters"],
    ["/discover/ummah", "Don’t Forget the Ummah"],
    ["/discover", "All du’as"],
    ["/discover/prophetic", "Prophetic Du’as"],
    ["/discover/profiles", "Du’a Profiles"],
    ["/discover/when-to-make-dua", "When to Make Du?a"],
  ];
  return <nav className="filters" aria-label="Du’a library sections">
    {links.map(([path, label]) => (
      <Link key={path} className="button" to={path + (path === "/discover" || path === "/discover/prophetic" ? search : "")}
        aria-current={pathname === path || (path === "/discover/profiles" && pathname.startsWith(path + "/")) ? "page" : undefined}>
        {label}
      </Link>
    ))}
  </nav>;
}
