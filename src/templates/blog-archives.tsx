import * as React from 'react'
import Archives from '../components/Archives'
import Main from '../components/Main'
import Position from '../components/base/Position'
export interface IArchive {
  year: number
  posts: any[]
}
export default (props: {
  data: any
  pageContext: {
    archives: IArchive[]
    totalCount: number
  }
}) => {
  return (
    <Main>
      <Position title="归档" />
      <Archives archives={props.pageContext.archives} />
    </Main>
  )
}
