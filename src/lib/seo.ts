// SEO utility functions for dynamic meta tags

export function updatePageTitle(title: string) {
  document.title = title ? `${title} | Mount Kenya News` : 'Mount Kenya News - Your Trusted Source for News';
}

export function updateMetaDescription(description: string) {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = description;
}

export function updateMetaTags(options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  const { title, description, image, url, type = 'article' } = options;

  if (title) {
    updatePageTitle(title);
    
    // Open Graph title
    updateMetaTag('og:title', title + ' | Mount Kenya News');
    updateMetaTag('twitter:title', title + ' | Mount Kenya News');
  }

  if (description) {
    updateMetaDescription(description);
    updateMetaTag('og:description', description);
    updateMetaTag('twitter:description', description);
  }

  if (image) {
    updateMetaTag('og:image', image);
    updateMetaTag('twitter:image', image);
  }

  if (url) {
    updateMetaTag('og:url', url);
    updateMetaTag('twitter:url', url);
  }

  updateMetaTag('og:type', type);
  updateMetaTag('twitter:card', 'summary_large_image');
}

function updateMetaTag(property: string, content: string) {
  const isOg = property.startsWith('og:');
  const attr = isOg ? 'property' : 'name';
  
  let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function resetMetaTags() {
  updatePageTitle('');
  updateMetaDescription('Your trusted source for the latest news from Mt. Kenya region and Kenya. Breaking news, politics, business, sports, entertainment, and more.');
}
