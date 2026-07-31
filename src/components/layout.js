import { Link } from "gatsby"
import * as React from "react"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <nav className="site-nav">
        <Link className="header-link-home" to="/">
          {title}
        </Link>
        <Link className="site-nav-link" to="/blog/">
          Blog
        </Link>
      </nav>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        <div>
          <Link to="/about/">About</Link>
          {` · `}
          <Link to="/blog/">Blog</Link>
          {` · `}© {new Date().getFullYear()} {title}
        </div>
        <div style={{ marginTop: `var(--spacing-2)` }}>
          Built with{` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </div>
      </footer>
    </div>
  )
}

export default Layout
