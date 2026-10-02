import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  keywords, 
  url,
  image = 'https://www.farmbazar.com/logo.png', // Add a default logo path later if needed
  type = 'website'
}) {
  const siteName = 'FarmBazar';
  const defaultDescription = 'FarmBazar connects customers directly with local farmers to buy fresh vegetables, fruits, grains, and organic farm products online.';
  const defaultKeywords = 'FarmBazar, FarmBazar fresh vegetables, FarmBazar fresh fruits, farm to customer marketplace, buy fresh vegetables online, buy fresh fruits online, buy farm products online, fresh farm products, organic vegetables online, direct from farmers, local farmers marketplace, fresh produce delivery, farmer marketplace India, farm fresh grocery online, online vegetable delivery, organic fruits and vegetables, fresh food marketplace, farmer to customer platform, agricultural products online, buy directly from farmers';

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name='description' content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />

      {/* OpenGraph tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image} />
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "url": "https://www.farmbazar.com/",
          "description": defaultDescription,
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.farmbazar.com/logo.png"
            }
          }
        })}
      </script>
    </Helmet>
  );
}
