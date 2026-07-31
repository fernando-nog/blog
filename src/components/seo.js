/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import { graphql, useStaticQuery } from "gatsby"
import PropTypes from "prop-types"
import * as React from "react"
import { Helmet } from "react-helmet"

const Seo = ({
  description,
  lang,
  meta,
  title,
  image,
  article = false,
  canonicalUrl,
  pathname,
  noindex = false,
  datePublished,
  dateModified,
}) => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
          image
          author {
            name
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

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl || ""
  const defaultImage = image || site.siteMetadata?.image
  const imageUrl = defaultImage ? `${siteUrl}${defaultImage}` : null
  const pagePath = pathname || "/"
  const pageUrl = canonicalUrl || `${siteUrl}${pagePath}`
  const author = site.siteMetadata?.author?.name || ""
  const authorSummary = site.siteMetadata?.author?.summary || ""
  const linkedin = site.siteMetadata?.social?.linkedin || ""
  const stackoverflow = site.siteMetadata?.social?.stackoverflow || ""
  const github = site.siteMetadata?.social?.github || ""
  const sameAs = [
    ...(linkedin ? [`https://www.linkedin.com/in/${linkedin}`] : []),
    ...(stackoverflow
      ? [`https://stackoverflow.com/users/${stackoverflow}`]
      : []),
    ...(github ? [`https://github.com/${github}`] : []),
  ]

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author,
    jobTitle: "Tech Lead & Software Engineer",
    description: authorSummary,
    url: siteUrl,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: defaultTitle,
    url: siteUrl,
    author: {
      "@type": "Person",
      name: author,
    },
  }

  const blogPostingSchema = article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: metaDescription,
        author: {
          "@type": "Person",
          name: author,
          url: siteUrl,
          sameAs: sameAs.length > 0 ? sameAs : undefined,
        },
        publisher: {
          "@type": "Person",
          name: author,
          url: siteUrl,
        },
        url: pageUrl,
        image: imageUrl,
        datePublished: datePublished || undefined,
        dateModified: dateModified || datePublished || undefined,
      }
    : null

  const schemaObjects = [authorSchema, websiteSchema]
  if (blogPostingSchema) {
    schemaObjects.push(blogPostingSchema)
  }

  const schemaScript = {
    type: "application/ld+json",
    innerHTML: JSON.stringify(schemaObjects),
  }

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
      link={[
        {
          rel: "canonical",
          href: pageUrl,
        },
      ]}
      script={[schemaScript]}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        // Open Graph tags
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: article ? `article` : `website`,
        },
        {
          property: `og:url`,
          content: pageUrl,
        },
        {
          property: `og:site_name`,
          content: defaultTitle,
        },
        {
          property: `og:locale`,
          content: lang === "en" ? "en_US" : lang,
        },
        // Twitter Card tags
        {
          name: `twitter:card`,
          content: imageUrl ? `summary_large_image` : `summary`,
        },
        {
          name: `twitter:creator`,
          content: author,
        },
        {
          name: `twitter:site`,
          content: author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
        {
          name: `twitter:url`,
          content: pageUrl,
        },
        // Image tags
        ...(imageUrl
          ? [
              {
                property: `og:image`,
                content: imageUrl,
              },
              {
                property: `og:image:width`,
                content: `1200`,
              },
              {
                property: `og:image:height`,
                content: `630`,
              },
              {
                name: `twitter:image`,
                content: imageUrl,
              },
            ]
          : []),
        // Author and article specific tags
        ...(article && author
          ? [
              {
                name: `author`,
                content: author,
              },
            ]
          : []),
        // Robots tag for noindex
        ...(noindex
          ? [
              {
                name: `robots`,
                content: `noindex, nofollow`,
              },
              {
                name: `googlebot`,
                content: `noindex, nofollow`,
              },
            ]
          : []),
      ].concat(meta)}
    />
  )
}

Seo.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
  image: null,
  article: false,
  canonicalUrl: null,
  pathname: null,
  noindex: false,
  datePublished: null,
  dateModified: null,
}

Seo.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  article: PropTypes.bool,
  canonicalUrl: PropTypes.string,
  noindex: PropTypes.bool,
  pathname: PropTypes.string,
  datePublished: PropTypes.string,
  dateModified: PropTypes.string,
}

export default Seo
