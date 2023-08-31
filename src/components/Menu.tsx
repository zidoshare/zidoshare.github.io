import * as React from 'react'
import { GatsbyLinkProps } from 'gatsby-link'
import * as classes from './Menu.module.scss'
import classnames from 'classnames'
import Media from 'react-media'
import { CSSTransition } from 'react-transition-group'
import 'animate.css/source/sliding_entrances/slideInRight.css'
import { timeout } from '../contants/transition'
export interface MenuItem {
  name: string
  path: string
  Link: React.ComponentType<GatsbyLinkProps<any>>
}

export interface MenuProps {
  items: MenuItem[]
}

export interface MenuButtonProps {
  active: boolean
  onClick: (active: boolean) => void
}

export const MenuButton = (props: MenuButtonProps) => {
  return (
    <div
      className={classes.menuBtnContainer}
      onClick={() => {
        const active = !props.active
        props.onClick(active)
      }}
    >
      <div
        className={classnames(classes.menuBtn, {
          [classes.menuBtnActive]: props.active,
        })}
      >
        <div />
      </div>
    </div>
  )
}

export default class Menu extends React.Component<MenuProps, { active: boolean }> {
  state: {
    active: boolean
  } = {
      active: false,
    }
  bodyClassName: string
  htmlClassName: string
  render() {
    return (
      <div>
        <Media queries={{
          small: "(max-width: 720px)",
          large: "(min-width: 721px)"
        }}>
          {(matches: {
            small: boolean,
            large: boolean,
          }) => {
            console.log(matches)
            if (matches.large) {
              return <nav className={classes.topPosition}>
                {this.props.items.map((item, index) => (
                  <item.Link to={item.path} key={index}>{item.name}</item.Link>
                ))}
              </nav>
            }
            return <nav className={classes.topPosition}>
              <MenuButton active={this.state.active} onClick={this.handleClick} />
              <CSSTransition
                classNames={{
                  enter: classes.menuShow,
                  enterActive: 'slideInRight duration',
                  exit: 'animated',
                  exitActive: classes.slideOutRight,
                  exitDone: classes.menuExited,
                }}
                in={this.state.active}
                unmountOnExit
                timeout={timeout}
              >
                {() => (
                  <div className={classnames(classes.menuInner)}>
                    <ul>
                      {this.props.items.map((item, index) => (
                        <li key={index}>
                          <item.Link
                            to={item.path}
                            onClick={() => {
                              this.handleClick(false)
                            }}
                          >
                            {item.name}
                          </item.Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CSSTransition>
            </nav>
          }}
        </Media>
      </div >
    )
  }
  private handleClick = (active: boolean) => {
    if (this.bodyClassName == null) {
      this.bodyClassName = document.body.className
    }
    if (this.htmlClassName == null) {
      this.htmlClassName = document.documentElement.className
    }
    document.body.className = classnames(this.bodyClassName, {
      [classes.menuOpen]: active,
    })
    document.documentElement.className = classnames(this.htmlClassName, {
      [classes.htmlMenuOpen]: active,
    })
    this.setState({
      active,
    })
  }
}
