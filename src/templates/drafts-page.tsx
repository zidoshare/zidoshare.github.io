import * as React from 'react'
import Blog, { IndexProps } from '../containers/BlogContainer'
import { graphql } from 'gatsby'
import Position from '../components/base/Position'
export default (props: IndexProps) => (
  <main>
    <Position title="草稿箱" />
    <Blog {...props} />
  </main>
)

export const pageQuery = graphql`
  query PageDrafts {
    # Get posts
    posts: allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___updatedDate] }
      filter: { frontmatter: { draft: { eq: true } }, fileAbsolutePath: { regex: "/blog/" } }
      limit: 10
    ) {
      totalCount
      edges {
        node {
          wordCount {
            words
          }
          excerpt
          timeToRead
          fields {
            slug
          }
          frontmatter {
            title
            updatedDate(formatString: "YYYY年MM月DD日")
            tags
            origin
          }
        }
      }
    }
  }
`
