import { Link, useLocation } from "react-router-dom";
import "./dua-profiles.css";

export function DiscoverSections() {
  const { pathname, search } = useLocation();
  const links = [
    ["/discover", "All du’as"],
    ["/discover/prophetic", "Prophetic Du’as"],
    ["/discover/profiles", "Du’a Profiles"],
  ];
  return <nav className="filters" aria-label="Du’a library sections">
    {links.map(([path, label]) => (
      <Link key={path} className="button" to={path + (path === "/discover/profiles" ? "" : search)}
        aria-current={pathname === path || (path === "/discover/profiles" && pathname.startsWith(path + "/")) ? "page" : undefined}>
        {label}
      </Link>
    ))}
  </nav>;
}
