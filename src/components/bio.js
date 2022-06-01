/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import { graphql, useStaticQuery } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import * as React from "react"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author {
            name
            summary
          }
          social {
            linkedin
            stackoverflow
            github
          }
        }
      }
    }
  `)

  // Set these values by editing "siteMetadata" in gatsby-config.js
  const author = data.site.siteMetadata?.author
  const social = data.site.siteMetadata?.social

  return (
    <div className="bio">
      <StaticImage
        className="bio-avatar"
        layout="fixed"
        formats={["auto", "webp", "avif"]}
        src="../images/profile-pic.jpeg"
        width={50}
        height={50}
        quality={95}
        alt="Profile picture"
      />
      {author?.name && (
        <div>
        <p>
          Written by <strong>{author.name}</strong> {author?.summary || null}
          {` `}
          </p>
          <p>
            <a href={`https://www.linkedin.com/in/${social?.linkedin || ``}`}>
              Linkedin
            </a>           
            {` `}
            <a href={`https://stackoverflow.com/users/${social?.stackoverflow || ``}`}>
              Stackoverflow
            </a> 
            {` `}
            <a href={`https://github.com/${social?.github || ``}`}>
              Github
            </a>  
          </p>
        </div>
      )}
    </div>
  )
}

export default Bio
