import { NextPage } from 'next'
import Link from 'next/link'

const PageNotFound: NextPage = () => {
  return <>
    <h1>404 - Page Not Found</h1>
    <Link href="/">
      <a>
        Go back home
      </a>
    </Link>
  </>
}

export default PageNotFound