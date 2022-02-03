import * as React from 'react'
import * as classes from './Layout.module.scss'
import '../global.scss'
import Header from './Header'
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
      <>
        <Affix>
          <Header />
        </Affix>
        <div className={classes.content}>
          {/* 页头 */}

          {/* 内容 */}
          {this.props.children}
        </div>
        {/* 页尾 */}
        <Footer />
      </>
    )
  }
}
