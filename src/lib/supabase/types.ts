export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      diary_entries: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;         // auth.uid()
          date: string;            // YYYY-MM-DD
          // 갑자 정보 (계산해서 저장)
          day_gapja: string;       // 예: 갑자
          month_gapja: string;
          year_gapja: string;
          day_gapja_idx: number;   // 0~59
          month_gapja_idx: number;
          year_gapja_idx: number;
          // 일기 내용
          title: string | null;
          content: string;
          mood: string | null;
          tags: string[] | null;
          energy_level: number | null; // 1~5
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;        // DB default: auth.uid()
          date: string;
          day_gapja: string;
          month_gapja: string;
          year_gapja: string;
          day_gapja_idx: number;
          month_gapja_idx: number;
          year_gapja_idx: number;
          title?: string | null;
          content: string;
          mood?: string | null;
          tags?: string[] | null;
          energy_level?: number | null;
        };
        Update: {
          id?: string;
          updated_at?: string;
          date?: string;
          day_gapja?: string;
          month_gapja?: string;
          year_gapja?: string;
          day_gapja_idx?: number;
          month_gapja_idx?: number;
          year_gapja_idx?: number;
          title?: string | null;
          content?: string;
          mood?: string | null;
          tags?: string[] | null;
          energy_level?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
export type DiaryInsert = Database['public']['Tables']['diary_entries']['Insert'];
export type DiaryUpdate = Database['public']['Tables']['diary_entries']['Update'];
