import { graphql, Link } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"

const AboutPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const author = data.site.siteMetadata?.author
  const social = data.site.siteMetadata?.social
  const profilePic = data.profilePic?.childImageSharp?.gatsbyImageData

  return (
    <Layout location={location} title={siteTitle}>
      <Seo
        title="About Fernando Nogueira"
        description="Fernando Nogueira is a Tech Lead and Software Engineer with 13+ years of experience building scalable systems in Java, Kotlin, Go, and cloud-native platforms."
        pathname={location.pathname}
      />
      <article className="blog-post">
        <header>
          <h1>About Fernando Nogueira</h1>
        </header>

        <section>
          {profilePic && (
            <GatsbyImage
              image={profilePic}
              alt="Fernando Nogueira"
              style={{
                borderRadius: `50%`,
                marginBottom: `var(--spacing-8)`,
                maxWidth: `180px`,
              }}
            />
          )}

          <p>
            I’m Fernando Nogueira, a Brazilian software engineer who lives and
            works remotely from Spain. I have spent the last 13+ years designing
            and building scalable, high-performance systems across finance,
            e-commerce, logistics, and SaaS.
          </p>

          <p>
            My daily work centers on backend architecture, microservices, cloud
            infrastructure, and the practical engineering decisions that make
            systems reliable under real load. I work primarily with{" "}
            <strong>Java</strong>, <strong>Kotlin</strong>, and{" "}
            <strong>Go</strong>, and I have deep hands-on experience with Spring
            Boot, Micronaut, Docker, Kubernetes, PostgreSQL, and cloud
            platforms.
          </p>

          <p>
            I also keep a foot in the frontend and AI tooling worlds. I use
            React and Angular when a project calls for it, and I experiment
            heavily with AI coding assistants, MCP servers, and agent workflows
            to understand where they actually help and where they just create
            noise.
          </p>

          <h2>What I Write About</h2>

          <p>
            This blog is my place to share practical lessons from building
            software in production. You will find deep dives on:
          </p>

          <ul>
            <li>Spring Boot, Jakarta EE, and the Java ecosystem</li>
            <li>Database migrations, SQL, and data architecture</li>
            <li>Docker, Kubernetes, and developer-platform tooling</li>
            <li>AI-assisted coding, LLM APIs, and agent workflows</li>
            <li>
              Engineering practices that survive real teams and real deadlines
            </li>
          </ul>

          <p>
            I write for working developers and tech leads. My goal is not to
            cover every feature, but to explain the parts that matter when you
            are shipping and maintaining real systems.
          </p>

          <h2>Experience</h2>

          <p>
            Over my career I have worked as a backend developer, systems
            architect, and tech lead. I have led teams building microservices at
            scale, designed APIs used by millions of requests per day, and
            migrated legacy systems to modern cloud-native stacks.
          </p>

          <p>
            I am particularly interested in the intersection of clean
            architecture, operational resilience, and team velocity: how to
            build systems that are easy to change, test, and run in production.
          </p>

          <h2>Get in Touch</h2>

          <p>
            You can find me on{" "}
            <a
              href={`https://www.linkedin.com/in/${social?.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            ,{" "}
            <a
              href={`https://stackoverflow.com/users/${social?.stackoverflow}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Stack Overflow
            </a>
            , and{" "}
            <a
              href={`https://github.com/${social?.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . If you want to read my latest posts, head to the{" "}
            <Link to="/blog/">blog</Link>.
          </p>
        </section>
      </article>
    </Layout>
  )
}

export default AboutPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
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
    profilePic: file(relativePath: { eq: "profile-pic.jpeg" }) {
      childImageSharp {
        gatsbyImageData(layout: FIXED, width: 180, height: 180)
      }
    }
  }
`
