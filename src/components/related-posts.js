import { graphql, useStaticQuery, Link } from "gatsby"
import * as React from "react"

const RelatedPosts = ({ currentSlug, currentTags }) => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
        nodes {
          fields {
            slug
          }
          frontmatter {
            title
            date
            tags
          }
        }
      }
    }
  `)

  if (!currentTags || currentTags.length === 0) {
    return null
  }

  const currentTagSet = new Set(currentTags.map(tag => tag.toLowerCase()))

  const related = data.allMarkdownRemark.nodes
    .filter(post => post.fields.slug !== currentSlug)
    .map(post => {
      const postTags = post.frontmatter.tags || []
      const matches = postTags.filter(tag =>
        currentTagSet.has(tag.toLowerCase()),
      ).length
      return { ...post, score: matches }
    })
    .filter(post => post.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
    })
    .slice(0, 4)

  if (related.length === 0) {
    return null
  }

  return (
    <aside className="related-posts" aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading">Related posts</h2>
      <ul>
        {related.map(post => (
          <li key={post.fields.slug}>
            <Link to={post.fields.slug}>{post.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default RelatedPosts
