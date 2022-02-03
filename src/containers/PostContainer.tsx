import * as React from 'react'
import Position from '../components/base/Position'
import BlogPost from '../components/BlogPost'
interface BlogPostProps {
  data: {
    post: any
    recents: any
    site: any
    dataJson: any
  }
  pageContext: {
    header: any
  }
}

export default (props: BlogPostProps) => {
  const { post, dataJson } = props.data
  const { slug } = post.fields
  const gitmentOptions = dataJson.gitment
  return (
    <BlogPost slug={slug} commentOptions={gitmentOptions} post={post} >
      <Position title={post.frontmatter.title} />
    </BlogPost>
  )
}
