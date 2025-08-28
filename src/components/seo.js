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
  noindex = false 
}) => {
  const { site } = useStaticQuery(
    graphql`
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
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl || ''
  const defaultImage = image || site.siteMetadata?.image
  const imageUrl = defaultImage ? `${siteUrl}${defaultImage}` : null
  const pageUrl = canonicalUrl || `${siteUrl}`
  const author = site.siteMetadata?.author?.name || ''

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
      link={[
        {
          rel: 'canonical',
          href: pageUrl,
        },
      ]}
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
          content: lang === 'en' ? 'en_US' : lang,
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
  noindex: false,
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
}

export default Seo
