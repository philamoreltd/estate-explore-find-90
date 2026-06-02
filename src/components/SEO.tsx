import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_URL = "https://housevilla.co.ke";

const SEO = ({ title, description, path, jsonLd, noindex }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {noindex && <meta name="robots" content="noindex" />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
