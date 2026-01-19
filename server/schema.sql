-- MT Kenya News Database Schema
-- Run this SQL in your Neon PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) DEFAULT NULL UNIQUE,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    featured_image TEXT DEFAULT '',
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reading_time INTEGER DEFAULT 5,
    views INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_breaking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscribers table for newsletter/interaction gating
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(200) DEFAULT '',
    is_verified BOOLEAN DEFAULT FALSE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Comments table (requires subscription)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article likes (requires subscription)
CREATE TABLE IF NOT EXISTS article_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, subscriber_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_breaking ON articles(is_breaking);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_article ON article_likes(article_id);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Politics', 'politics', 'Political news and analysis from Kenya and beyond'),
    ('Business', 'business', 'Business, economy, and market news'),
    ('Counties', 'counties', 'News from all 47 counties of Kenya'),
    ('Sports', 'sports', 'Sports news, scores, and updates'),
    ('Entertainment', 'entertainment', 'Entertainment, celebrity, and lifestyle news'),
    ('Opinion', 'opinion', 'Editorials, opinions, and commentary'),
    ('Investigations', 'investigations', 'In-depth investigative journalism'),
    ('Lifestyle', 'lifestyle', 'Health, fashion, travel, and lifestyle content'),
    ('Technology', 'technology', 'Tech news, gadgets, and digital trends'),
    ('World', 'world', 'International news and global affairs')
ON CONFLICT (slug) DO NOTHING;

-- Insert default author
INSERT INTO authors (name, bio, avatar_url) VALUES
    ('MT Kenya News', 'The editorial team at Mount Kenya News', 'https://ui-avatars.com/api/?name=MT+Kenya&background=1e40af&color=fff&size=200')
ON CONFLICT DO NOTHING;
