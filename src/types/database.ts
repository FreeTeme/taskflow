export type BoardRole = 'owner' | 'member'
export type TaskPriority = 'low' | 'medium' | 'high'
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          title: string
          owner_id: string
          created_at: string
        }
        Insert: {
          title: string
          owner_id: string
        }
        Update: {
          title?: string
        }
        Relationships: []
      }
      board_members: {
        Row: {
          id: string
          board_id: string
          user_id: string
          role: BoardRole
        }
        Insert: {
          board_id: string
          user_id: string
          role?: BoardRole
        }
        Update: {
          role?: BoardRole
        }
        Relationships: []
      }
      columns: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
        }
        Insert: {
          board_id: string
          title: string
          position?: number
        }
        Update: {
          title?: string
          position?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          column_id: string
          title: string
          description: string | null
          priority: TaskPriority
          due_date: string | null
          assignee_id: string | null
          position: number
          created_by: string
          created_at: string
        }
        Insert: {
          column_id: string
          title: string
          created_by: string
          position?: number
          description?: string | null
          priority?: TaskPriority
          due_date?: string | null
          assignee_id?: string | null
        }
        Update: {
          column_id?: string
          title?: string
          description?: string | null
          priority?: TaskPriority
          due_date?: string | null
          assignee_id?: string | null
          position?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          task_id: string
          user_id: string
          content: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      invite_member_by_email: {
        Args: {
          p_board_id: string
          p_email: string
        }
        Returns: string
      }
      reorder_tasks: {
        Args: {
          p_updates: Json
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Board = Database['public']['Tables']['boards']['Row']
export type BoardMember = Database['public']['Tables']['board_members']['Row']
export type Column = Database['public']['Tables']['columns']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type TaskWithAssignee = Task & {
  assignee?: Profile | null
}

export type CommentWithAuthor = Comment & {
  author?: Profile | null
}

export type BoardMemberWithProfile = BoardMember & {
  profile?: Profile | null
}
