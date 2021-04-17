import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import { formatDate } from '../../utils/formatDate';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  function getReadingTime(): number {
    const totalWords = post.data.content.reduce((total, content) => {
      total += `${content.heading} `;
      const body = RichText.asText(content.body);
      total += body;

      return total;
    }, '');

    const wordCount = totalWords.split(/\s/).length;

    return Math.ceil(wordCount / 200);
  }

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />
      <img
        src={post.data.banner.url}
        alt={post.data.title}
        className={styles.banner}
      />
      <main className={commonStyles.main}>
        <article className={styles.article}>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div className={styles.detailsWrapper}>
            <FiCalendar fontSize={16} />
            <time>{formatDate(post.first_publication_date)}</time>
            <FiUser fontSize={16} />
            <span>{post.data.author}</span>
            <FiClock fontSize={16} />
            <span>{getReadingTime()} min</span>
          </div>

          {post.data.content.map(content => (
            <section key={content.heading}>
              <h2 className={styles.heading}>{content.heading}</h2>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 2, fetch: ['posts.uid'] }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(item => ({
    heading: item.heading,
    body: item.body,
  }));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      banner: {
        url: response.data.banner.url,
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60,
  };
};
