import * as React from 'react'
import { MarkdownHeading } from '../graphql-types'
import { withDefaultProps } from '../utils/props'
import WindowEventHandler from './base/WindowEventHandler'
import classnames from 'classnames'
import './MarkNav.scss'
export interface MarkNavProps {
  headings: Array<MarkdownHeading>
  ordered: boolean
  className: string
}

interface MarkNavState {
  currentListNo: string
  scrollHeadings: Array<ScrollHeading>
}

interface ScrollHeading extends MarkdownHeading {
  top: number
  active: boolean
  showValue: string
}

function getElementTop(el: HTMLElement): number {
  let actualTop = el.offsetTop

  let current = el.offsetParent as HTMLElement

  while (current !== null) {
    actualTop += current.offsetTop

    current = current.offsetParent as HTMLElement
  }

  return actualTop
}

function mapNav(headings: Array<ScrollHeading>): Array<Object> {
  return headings.map((heading, index) => (
    <a
      key={index}
      className={classnames('head-nav-item', { active: heading.active })}
      href={`#${heading.value}`}
      onClick={e => {
        e.preventDefault()
        window.scrollTo({
          top: heading.top + 1,
        })
      }}
    >
      {heading.value}
    </a>
  ))
}
function mapHeading(heading: string): string {
  return heading.toLowerCase().replace(' ', '-')
}

class MarkNav extends React.Component<MarkNavProps, MarkNavState> {
  constructor(props: MarkNavProps) {
    super(props)
    this.state = {
      currentListNo: '',
      scrollHeadings: [],
    }
  }

  componentDidMount() {
    let scrollHeadings = this.props.headings.map(heading => {
      const key = mapHeading(heading.value)
      let h = document.getElementById(key)
      //TODO fix mao
      if (h) {
        let mao = h.querySelector('a.anchor') as HTMLAnchorElement
        let top = getElementTop(h)
        mao.onclick = e => {
          e.preventDefault()
          window.scrollTo({
            top: top + 1,
          })
        }
        return {
          ...heading,
          top,
          active: false,
          showValue: key,
        }
      }
      return {
        ...heading,
        top: 0,
        active: false,
        showValue: key,
      }
    })
    this.updateScroll(scrollHeadings)
  }

  private updateScroll(scrollHeadings: Array<ScrollHeading>) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    let last = 0,
      active = false
    for (let i = 0; i < scrollHeadings.length; i++) {
      scrollHeadings[i].active = false
      if (!active && scrollHeadings[i].top >= scrollTop) {
        scrollHeadings[last].active = true
        active = true
      }
      last = i
    }
    if (!active) {
      scrollHeadings[last].active = true
    }
    this.setState({
      scrollHeadings,
    })
  }

  private handleScroll() {
    this.updateScroll(this.state.scrollHeadings)
  }

  render() {
    return (
      <div className="mark-nav">
        {mapNav(this.state.scrollHeadings)}
        <WindowEventHandler eventName={'scroll'} callback={this.handleScroll.bind(this)} />
      </div>
    )
  }
}

export default withDefaultProps(
  {
    ordered: false,
    className: '',
  },
  MarkNav
)
