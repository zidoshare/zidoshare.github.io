import * as React from 'react'
import { Link, StaticQuery, graphql } from 'gatsby'
import * as classes from './Header.module.scss'
import StarCanvas from './StarCanvas'
import { HOME_TITLE } from '../contants/layout'
import WindowEventHandler from '../components/base/WindowEventHandler'
import Menu from './Menu'
import OutLink from './base/OutLink'
import { connect } from 'react-redux'
import { StoreState } from '../state'
import {GatsbyImage} from 'gatsby-plugin-image'

export const menuItems = [
  { name: '首页', path: '/', Link },
  { name: '归档', path: '/archives/', Link },
  { name: '标签', path: '/tags/', Link },
]

export class Header extends React.Component {


  render() {
    return (
      <header
        className={classes.header}
      >
        {/* <WindowEventHandler eventName="resize" callback={this.handleResize} /> */}
        <StaticQuery
          query={graphql`
            {
              dataJson {
                menu {
                  path
                  name
                }
              }
            }
          `}
          render={(data: any) => {
            const extraItems = data.dataJson.menu
            const items = [
              ...menuItems,
              ...extraItems.map((item: any) => ({
                ...item,
                Link: item.path.startsWith('/') ? Link : OutLink,
              })),
              {
                Link: OutLink,
                name: 'rss',
                path: '/rss.xml',
              },
            ]
            if (this.props.boom) {
              items.splice(0, 0, {
                Link,
                name: '草稿箱',
                path: '/drafts',
              })
            }
            return <Menu items={items} />
          }}
        />

        <h1 className={classes.headerTitle}>
          <Link to="/">{HOME_TITLE}</Link>
        </h1>
      </header>
    )
  }
}

const mapStateToProps = (state: StoreState) => ({
  boom: state.boom,
})

export default connect(mapStateToProps)(Header)
