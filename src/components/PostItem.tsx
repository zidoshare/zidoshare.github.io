import * as React from 'react'
import { Link } from 'gatsby'
import * as classes from './PostItem.module.scss'
import TagsCard, { TagsCardProps } from './TagsCard'
import {GatsbyImage,IGatsbyImageData} from 'gatsby-plugin-image'
export interface PostItemProps extends TagsCardProps {
  cover: IGatsbyImageData
  title: string
  updatedDate: Date
  href: string
  excerpt: string
  timeToRead: number
  words: number
  origin: boolean
}

export default (props: PostItemProps) => {
  const { cover, title, updatedDate, href, excerpt, timeToRead, words, origin } = props
  return (
    <div className={classes.postItem}>
      <div className={classes.timeLabel}>
        <p>{updatedDate}</p>
      </div>
      <div className={classes.itemMain}>
        <div className={classes.cover}>
          <Link to={href}>
            <GatsbyImage image={cover} alt="cover" />
          </Link>
        </div>
        <div className={classes.itemElse}>
          <TagsCard Link={Link} tags={props.tags} origin={origin} />
          <h1>
            <Link to={href}>{title}</Link>
          </h1>
          <article className={classes.excerpt} dangerouslySetInnerHTML={{ __html: excerpt }} />
          <p className={classes.here}>
            共{words}字-大约需要阅读{timeToRead}min
          </p>
        </div>
      </div>
    </div>
  )
}
