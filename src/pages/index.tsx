import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';
import { formatDate } from '../utils/formatDate';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [loadMorePosts, setLoadMorePosts] = useState(
    !!postsPagination.next_page
  );

  async function handleLoadMorePosts(): Promise<void> {
    const loadMorePostsResponse: ApiSearchResponse = await (
      await fetch(postsPagination.next_page)
    ).json();

    setPosts([...posts, ...loadMorePostsResponse.results]);
    setLoadMorePosts(!!loadMorePostsResponse.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | spacetravelling</title>
      </Head>

      <Header />

      <main className={commonStyles.main}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.postWrapper}>
              <h2 className={styles.title}>{post.data.title}</h2>
              <p className={styles.subtitle}>{post.data.subtitle}</p>
              <div className={styles.detailsWrapper}>
                <FiCalendar />
                <time>{formatDate(post.first_publication_date)}</time>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
            </a>
          </Link>
        ))}
        {!!loadMorePosts && (
          <button
            type="button"
            onClick={handleLoadMorePosts}
            className={styles.loadMoreButton}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 4,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60,
  };
};
