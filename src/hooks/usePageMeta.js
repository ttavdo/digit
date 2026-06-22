import { useEffect } from 'react'
import { SITE_DESCRIPTION } from '../constants/brand'

function usePageMeta(title, description = SITE_DESCRIPTION) {
  useEffect(() => {
    document.title = title

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [title, description])
}

export default usePageMeta
