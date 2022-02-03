import * as React from 'react'
import Layout from '../components/Layout'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { timeout } from '../contants/transition'
import 'animate.css/source/fading_entrances/fadeIn.css'
import './transition.scss'
export default ({ element, props }: any) => {
  return (
    <Layout {...props}>
      <TransitionGroup>
        <CSSTransition
          key={props.location.pathname}
          classNames={{
            enter: 'animated',
            enterActive: 'fadeIn duration',
            exit: 'hide-exit',
          }}
          timeout={timeout}
          unmountOnExit
        >
          {element}
        </CSSTransition>
      </TransitionGroup>
    </Layout>
  )
}
