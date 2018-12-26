import * as React from 'react'
import { LayoutProps } from '../components/Layout'
import { MarkdownRemark, MarkdownRemarkConnection, Site, DataJson } from '../graphql-types'
import Tag from '../components/Tag'
import { get } from 'lodash'
interface BlogPostProps extends LayoutProps {
  data: {
    post: MarkdownRemark
    recents: MarkdownRemarkConnection
    site: Site
    dataJson: DataJson
  }
}
const BlogPost = (props: BlogPostProps) => {
  const { frontmatter, html, timeToRead } = props.data.post
  const avatar = props.data.dataJson.avatar
  const tags = props.data.post.frontmatter.tags.map(tag => <Tag to={`/blog/tags/${tag}/`}>{tag}</Tag>)
  const recents = props.data.recents.edges.map(({ node }) => {
    const recentCover = get(node, 'frontmatter.image.children.0.fixed', {})
  })
}
export default () => <div />