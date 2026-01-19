export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      authors: {
        Row: {
          id: string;
          name: string;
          bio: string;
          avatar_url: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['authors']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['authors']['Insert']>;
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          featured_image: string;
          category_id: string;
          author_id: string;
          published_at: string;
          reading_time: number;
          views: number;
          is_featured: boolean;
          is_breaking: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
    };
  };
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Author = Database['public']['Tables']['authors']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];

export interface ArticleWithRelations extends Article {
  categories: Category;
  authors: Author;
}
