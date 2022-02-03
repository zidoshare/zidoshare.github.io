import * as React from 'react'
import Blog, { IndexProps } from '../containers/BlogContainer'
import { graphql } from 'gatsby'
import Position from '../components/base/Position'
import StarCanvas from '../components/StarCanvas'
import AuthorInner from '../components/inner/AuthorInner'

interface HeadState {
  starHeight: number
  starWidth: number
  rejectClient: {
    x: number
    y: number
  }
}

export default class IndexPage extends React.Component<IndexProps, HeadState> {

  state: HeadState = {
    starHeight: 480,
    starWidth: 0,
    rejectClient: null,
  }

  handleResize = () => {
    let winWidth = 0
    if (window.innerWidth) {
      winWidth = window.innerWidth
    } else if (document.body && document.body.clientWidth) {
      winWidth = document.body.clientWidth
    }

    this.setState({
      starWidth: winWidth,
    })
  }

  render(): React.ReactNode {
    const props = this.props
    return (
      <main>
        <Position />
        <div style={{ position: 'relative' }}>
          <StarCanvas
            height={this.state.starHeight}
            width={this.state.starWidth}
            rejectClient={this.state.rejectClient}
          />
          <AuthorInner />
        </div>
        <Blog {...props} />
      </main>
    )
  }
}



export const pageQuery = graphql`
  query PageBlog {
    # Get posts
    posts: allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___updatedDate] }
      filter: { frontmatter: { draft: { ne: true } }, fileAbsolutePath: { regex: "/blog/" } }
      limit: 10
    ) {
      totalCount
      edges {
        node {
          wordCount {
            words
          }
          excerpt(format:HTML)
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
