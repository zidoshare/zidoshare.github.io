import * as React from 'react'
import * as classes from './Layout.module.scss'
import { StaticQuery, graphql } from 'gatsby'
import '../global.scss'
import Header from './Header'
import { Helmet } from 'react-helmet'
import { HeaderType } from '../contants/header'
import { InnerProps } from './inner'
import Footer from './Footer'
import Affix from './base/Affix'

export interface LayoutProps {
  location: {
    pathname: string
  }
  children: any
  headerType: HeaderType
  innerProps: InnerProps
}

export default class Layout extends React.Component<Readonly<LayoutProps>> {
  constructor(props: LayoutProps) {
    super(props)
  }
  render() {
    return (
      <div>
        <div className={classes.root}>
          {/* 页头 */}
          <Affix>
            <Header>
              {/* {inner} */}
              <StaticQuery
                query={graphql`
                  {
                    site {
                      siteMetadata {
                        description
                      }
                    }
                  }
                `}
                render={(data: any) => {
                  return (
                    <Helmet>
                      <meta name="description" content={data.site.siteMetadata.description} />
                    </Helmet>
                  )
                }}
              />
            </Header>
          </Affix>

          {/* 内容 */}
          <div>{this.props.children}</div>
        </div>
        {/* 页尾 */}
        <Footer />
      </div>
    )
  }
}
