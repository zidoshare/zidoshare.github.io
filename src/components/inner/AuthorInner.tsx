import * as React from 'react'
import Bio from '../Bio'
import './AuthorInner.scss'
import { StaticQuery, graphql } from 'gatsby'
import { GatsbyImage } from 'gatsby-plugin-image'

export default class AuthorInner extends React.Component {
  render() {
    // avatar {
    //   childrenImageSharp {
    //     gatsbyImageData(width: 80, height: 80)
    //   }
    // }
    return (
      <StaticQuery
        query={graphql`
          {
            site {
              siteMetadata {
                title
                description
              }
            }
            allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } }, fileAbsolutePath: { regex: "/blog/" } }) {
              totalCount
            }
            dataJson {
              author {
                name
                avatar {
                  childrenImageSharp {
                    gatsbyImageData(width: 80, height: 80)
                  }
                }
              }
              speech
            }
          }
        `}
        render={(data: any) => {
          const avatar = data.dataJson.author.avatar
          const totalCount = data.allMarkdownRemark.totalCount
          const { name } = data.dataJson.author
          return (
            <div className="person-header">
              <div className="author-inner">
                <div>
                  <GatsbyImage alt={name} image={avatar.childrenImageSharp[0].gatsbyImageData} className="avatar"/>
                </div>
                <div style={{ textAlign: 'left', marginLeft: 20 }}>
                  <p>{totalCount} 篇文章</p>
                  <h1>{data.site.siteMetadata.title}</h1>
                  <p>{data.site.siteMetadata.description}</p>
                </div>
              </div>
              <div className={'inner-bio'}>
                <Bio text={data.dataJson.speech} />
              </div>
            </div>
          )
        }}
      />
    )
  }
}
