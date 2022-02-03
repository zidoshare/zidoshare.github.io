import * as React from 'react'
import { Link, StaticQuery, graphql } from 'gatsby'
import * as classes from './Header.module.scss'
import { HOME_TITLE } from '../contants/layout'
import Menu from './Menu'
import OutLink from './base/OutLink'

export const menuItems = [
  { name: '首页', path: '/', Link },
  { name: '归档', path: '/archives/', Link },
  { name: '标签', path: '/tags/', Link },
]

export default class Header extends React.Component {
  render() {
    return (
      <header
        className={classes.header}
      >
        {/* <WindowEventHandler eventName="resize" callback={this.handleResize} /> */}
        <Link className={classes.headerTitle} to="/">{HOME_TITLE}</Link>
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
            // if (this.props.boom) {
            //   items.splice(0, 0, {
            //     Link,
            //     name: '草稿箱',
            //     path: '/drafts',
            //   })
            // }
            return <Menu items={items} />
          }}
        />
      </header>
    )
  }
}