import * as React from 'react'
import { graphql, Link } from 'gatsby'
import Position from '../components/base/Position'
import Main from '../components/Main'
import TagsCard from '../components/TagsCard'
import NoData from '../components/base/NoData'
export interface TagsPageProps {
  data: {
    tags: {
      group: Array<{
        fieldValue: string
        totalCount: number
      }>
    }
  }
}

export default class TagsPage extends React.Component<TagsPageProps> {
  render() {
    const { tags } = this.props.data
    return (
      <Main>
        <Position title="标签云" />
        {tags.group ? (
          <TagsCard
            tagSize="large"
            tags={tags.group.map(tag => ({
              name: tag.fieldValue,
              count: tag.totalCount,
            }))}
            Link={Link}
          />
        ) : (
          <NoData />
        )}
      </Main>
    )
  }
}

export const pageQuery = graphql`
  {
    tags: allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___updatedDate] }
      filter: { frontmatter: { draft: { ne: true } }, fileAbsolutePath: { regex: "/blog/" } }
    ) {
      group(field: frontmatter___tags, limit: 3) {
        fieldValue
        totalCount
      }
    }
  }
`
